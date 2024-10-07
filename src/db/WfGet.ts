import { parseQuery } from "../parsers/index.ts";
import { config } from "../plugin/config.ts";
import { WfError } from "./WfError.ts";
import { getAll, getItem } from "./bindings/denoKv.ts";

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

export interface WfGetQueryResolved<S> extends WfGetQuery {
  data?: Array<S & { id: string }>;
}

export interface WfGetItemResolved<S> extends WfGetItem {
  data?: S & { id: string };
}

export const resolveGet = async <S>(
  get: WfGetQuery | WfGetItem,
): Promise<WfGetQueryResolved<S> | WfGetItemResolved<S>> => {
  const model = config.models.find((model) =>
    model.modelName === get.modelName
  );
  if (!model) {
    throw new WfError(422);
  }

  if (isWfGetQuery(get)) {
    const allItems = await getAll(model)();

    if (model.querySchema && model.runQuery) {
      try {
        const queryParams = parseQuery(model.querySchema)(get.query || "");
        const data = model.runQuery(allItems)(queryParams);
        return {
          ...get,
          data,
        };
      } catch (err) {
        throw new WfError(400, err.message);
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
  }

  const item = await getItem(model)(get.slug);
  if (!item) throw new WfError(404);
  return {
    ...get,
    data: item,
  };
};

export const resolveGetToHttp = async (get: WfGetQuery | WfGetItem) => {
  try {
    const resolved = await resolveGet(get);
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
