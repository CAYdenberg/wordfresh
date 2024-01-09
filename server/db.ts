import { MangoQuery, Model, Schema, WithCouch, WithSlug } from "./Model.ts";
import { getConfig } from "./mod.ts";

class HttpError extends Error {
  public status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}`);
    this.status = status;
  }
}

const doRequest = async (
  path: string,
  method: RequestInit["method"],
  data?: MangoQuery | Record<string, unknown>
) => {
  const headers: RequestInit["headers"] = {};
  let body: BodyInit | undefined;

  if (data) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }

  const res = await fetch(`${getConfig().dbBaseUrl}/${path}`, {
    method,
    headers,
    body,
  });

  const contentType = res.headers.get("Content-Type");
  if (res.status < 400 && contentType === "application/json") {
    const body = await res.json();
    return body;
  } else if (res.status < 400 && contentType?.startsWith("text/")) {
    const body = await res.text();
    return body;
  } else if (res.status < 400) {
    const body = await res.blob();
    return body;
  } else {
    throw new HttpError(res.status);
  }
};

const dbExists = async () => {
  try {
    const dbList: string[] = await doRequest("_all_dbs", "GET");
    return dbList.includes(getConfig().dbName);
  } catch (_e: unknown) {
    return false;
  }
};

const createDb = async () => {
  const res = await doRequest(getConfig().dbName, "PUT");
  if (res.ok) {
    return true;
  } else {
    throw new Error("DB creation failed");
  }
};

const createIndex = async <S extends Schema>(model: Model<S>) => {
  const { index: fields } = model;

  const fieldsAsArray: string[] = Array.isArray(fields)
    ? fields
    : fields
    ? [fields]
    : [];

  const fullIndex = ["modelName", ...fieldsAsArray];

  const result = await doRequest(`${getConfig().dbName}/_index`, "POST", {
    index: { fields: fullIndex },
  });

  return ["created", "exists"].includes(result.result);
};

export const provision = async (models: Array<Model<Schema>>) => {
  const exists = await dbExists();

  if (!exists) {
    await createDb();
  }

  await Promise.all(
    models.map((model) => {
      createIndex(model).catch(() => {
        console.log(
          `Failed to create design document for ${model.modelName}, proceeding ...`
        );
      });
    })
  );

  return true;
};

export const create =
  <S extends Schema>(model: Model<S>) =>
  async (data: S): Promise<{ _id: string; _rev: string }> => {
    const id = `${getConfig().projectId}:${model.modelName}:${model.getId(
      data
    )}`;
    const result = await doRequest(`${getConfig().dbName}/${id}`, "PUT", {
      _id: id,
      modelName: model.modelName,
      ...data,
    });

    return { _id: result.id, _rev: result.rev };
  };

export const forceCreate =
  <S extends Schema>(model: Model<S>) =>
  async (data: S): Promise<{ _id: string; _rev: string }> => {
    const id = `${getConfig().projectId}:${model.modelName}:${model.getId(
      data
    )}`;

    try {
      const existing = await doRequest(`${getConfig().dbName}/${id}`, "GET");
      const result = await doRequest(`${getConfig().dbName}/${id}`, "PUT", {
        ...data,
        modelName: model.modelName,
        _rev: existing._rev,
      });
      return { _id: result.id, _rev: result.rev };
    } catch (e) {
      if (e.status === 404) {
        return create(model)(data);
      }
      throw e;
    }
  };

const stripCouchFields = <S extends Schema>(record: WithCouch<S>) => {
  return Object.keys(record).reduce((acc, key) => {
    if (["_id", "_rev", "modelName"].includes(key)) {
      return acc;
    }
    const value = record[key];
    // deno-lint-ignore no-explicit-any
    (acc as any)[key] = value;
    return acc;
  }, {}) as S;
};

export const mangoQuery = <S extends Schema>(
  query: MangoQuery & { bookmark?: string }
): Promise<WithSlug<S>[]> => {
  return doRequest(`${getConfig().dbName}/_find`, "POST", query).then(
    (response) => {
      const results = response.docs.map((record: WithCouch<S>) => {
        const [_, __, slug] = record._id.split(":");
        return {
          ...stripCouchFields(record),
          slug,
        };
      });

      if (!query.limit && results.length > 0 && response.bookmark) {
        return mangoQuery({
          ...query,
          bookmark: response.bookmark,
        }).then((restOfResults) => [...results, ...restOfResults]);
      }

      return results;
    }
  );
};

export const modelQuery = <S extends Schema>(schema: Model<S>) => {
  return async (queryString?: string): Promise<WithSlug<S>[]> => {
    const baseQuery = {
      selector: {
        modelName: { $eq: schema.modelName },
      },
    };

    const modifiedQuery = schema.query
      ? schema.query(baseQuery, queryString)
      : baseQuery;

    const result = await mangoQuery<S>(modifiedQuery);
    return result;
  };
};

export const count = async <S extends Schema>(
  model: Model<S>
): Promise<number> => {
  const result = await doRequest(`${getConfig().dbName}/_find`, "POST", {
    selector: {
      modelName: {
        $eq: model.modelName,
      },
    },
    fields: ["_id"],
  });
  return result.docs.length;
};

export const getRecord =
  <S extends Schema>(schema: Model<S>) =>
  (slug: string): Promise<S | null> => {
    const id = `${getConfig().projectId}:${schema.modelName}:${slug}`;
    return doRequest(`${getConfig().dbName}/${id}`, "GET")
      .then((result) => {
        return {
          ...stripCouchFields(result),
          slug,
        };
      })
      .catch((err: HttpError | unknown) => {
        if ((err as HttpError).status === 404) {
          return null;
        }
        throw err;
      });
  };

export const putFile = async (
  id: string,
  rev: string,
  contentType: string,
  data: Uint8Array
): Promise<{ _id: string; _rev: string }> => {
  const res = await fetch(
    `${getConfig().dbBaseUrl}/${getConfig().dbName}/${id}/file`,
    {
      method: "PUT",
      headers: {
        ["Content-Type"]: contentType,
        ["If-Match"]: rev,
      },
      body: data,
    }
  );

  if (res.status < 400) {
    const json = await res.json();
    return { _id: json.id as string, _rev: json.rev as string };
  }
  throw new HttpError(res.status);
};

export const createFile =
  <S extends Schema>(schema: Model<S>) =>
  async (metadata: S, contentType: string, data: Uint8Array) => {
    const doc = await create(schema)(metadata);
    const withFile = await putFile(doc._id, doc._rev, contentType, data);
    return withFile;
  };

export const forceCreateFile =
  <S extends Schema>(schema: Model<S>) =>
  async (metadata: S, contentType: string, data: Uint8Array) => {
    const doc = await forceCreate(schema)(metadata);
    const withFile = await putFile(doc._id, doc._rev, contentType, data);
    return withFile;
  };

export const getFile =
  <S extends Schema>(schema: Model<S>) =>
  async (slug: string) => {
    const id = `${getConfig().projectId}:${schema.modelName}:${slug}`;
    const res = await fetch(
      `${getConfig().dbBaseUrl}/${getConfig().dbName}/${id}/file`,
      {
        method: "GET",
      }
    );
    return res;
  };
