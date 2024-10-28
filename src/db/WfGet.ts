import { parseQuery } from "../parsers/index.ts";
import { config } from "../plugin/config.ts";
import { WfError } from "./WfError.ts";
import { getAll, getItem } from "./bindings/denoKv.ts";

const SENTINEL = "wf:";

export interface WfGetQuery {
  modelName: string;
  query?: string;
}

export interface WfGetItem {
  modelName: string;
  slug: string;
}

const isWfGetQuery = (input: WfGetQuery | WfGetItem): input is WfGetQuery => {
  return !!((input as WfGetQuery).query);
};

export const parseWf = (wf: string): WfGetQuery | WfGetItem | null => {
  let url;
  try {
    url = new URL(wf);
  } catch (_) {
    return null;
  }

  if (url.protocol !== SENTINEL) return null;

  const [modelName, slug] = `${url.hostname}${url.pathname}`.split("/").filter(
    Boolean,
  );
  if (modelName && slug) {
    return {
      modelName,
      slug,
    };
  } else if (modelName) {
    return {
      modelName,
      query: url.search,
    };
  }

  return null;
};

export interface WfGetQueryResolved<S> extends WfGetQuery {
  data?: Array<S & { id: string }>;
}

export interface WfGetItemResolved<S> extends WfGetItem {
  data?: S & { id: string };
}

// deno-lint-ignore no-explicit-any
export type AnyWfGetResolved = WfGetQueryResolved<any> | WfGetItemResolved<any>;

export const resolveItem = async <S>(
  get: WfGetItem,
): Promise<WfGetItemResolved<S>> => {
  const model = config.models.find((model) =>
    model.modelName === get.modelName
  );
  if (!model) {
    throw new WfError(422);
  }

  const item = await getItem(model)(get.slug);
  if (!item) throw new WfError(404);
  return {
    ...get,
    data: item,
  };
};

export const resolveQuery = async <S>(
  get: WfGetQuery,
): Promise<WfGetQueryResolved<S>> => {
  const model = config.models.find((model) =>
    model.modelName === get.modelName
  );
  if (!model) {
    console.log(get.modelName);
    throw new WfError(422);
  }

  const allItems = await getAll(model)();

  if (model.querySchema && model.runQuery) {
    if (typeof get.query === "undefined") {
      throw new WfError(400, "Query string required");
    }
    try {
      const queryParams = parseQuery(model.querySchema)(get.query);
      const data = model.runQuery(allItems)(queryParams);
      return {
        ...get,
        data,
      };
    } catch (err) {
      throw new WfError(
        400,
        (err as Error).message || "An unknown error occurred",
      );
    }
  } else if (model.runQuery) {
    const data = model.runQuery(allItems)(undefined);
    return {
      ...get,
      data,
    };
  } else {
    return {
      ...get,
      data: allItems,
    };
  }
};

export const resolveToHttp = async (get: WfGetQuery | WfGetItem) => {
  try {
    const resolved = isWfGetQuery(get)
      ? await resolveQuery(get)
      : await resolveItem(get);
    return new Response(JSON.stringify(resolved.data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err: WfError | Error | unknown) {
    if ((err as WfError).isWfError) {
      return (err as WfError).toHttp();
    }
    throw err;
  }
};

export const resolveWf = async (
  ...request: string[]
): Promise<
  Record<string, AnyWfGetResolved>
> => {
  const resolutions = await Promise.all(request.map((wf) => {
    const get = parseWf(wf);
    if (!get) throw new WfError(400, "Not a WfQuery");
    return isWfGetQuery(get) ? resolveQuery(get) : resolveItem(get);
  }));

  return request.reduce(
    (acc, request, idx) => {
      acc[request] = resolutions[idx];
      return acc;
    },
    {} as Record<string, AnyWfGetResolved>,
  );
};
