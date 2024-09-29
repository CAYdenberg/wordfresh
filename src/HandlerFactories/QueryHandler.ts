import { Handler } from "$fresh/server.ts";
import { getAll } from "../db/denoKv.ts";
import { parseQuery } from "../parsers/parseQuery.ts";
import { Model } from "../models/Model.ts";
import { HttpError } from "./HttpError.ts";

export const QueryHandler = <S, Q>(model: Model<S, Q>): Handler => {
  const getter = getAll<S, Q>(model);

  return async (req: Request) => {
    const allItems = await getter();
    let items: Array<S & { id: string }>;

    if (model.querySchema && model.runQuery) {
      let queryParams: Q;

      try {
        const url = new URL(req.url);
        queryParams = parseQuery(model.querySchema)(url.search);
      } catch (_err: unknown) {
        return HttpError(
          400,
          `Invalid query parameters for model ${model.modelName}`,
        );
      }
      items = model.runQuery(allItems)(queryParams);
    } else if (model.runQuery) {
      items = model.runQuery(allItems)(undefined as Q);
    } else {
      items = allItems;
    }

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };
};
