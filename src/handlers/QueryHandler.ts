import { Handler } from "$fresh/server.ts";
import { Model } from "../db/Model.ts";
import { resolveToHttp } from "../db/index.ts";

export const QueryHandler = <S, Q>(model: Model<S, Q>): Handler => {
  return async (req: Request) => {
    const url = new URL(req.url);
    const result = await resolveToHttp({
      modelName: model.modelName,
      query: url.search,
    });
    return result;
  };
};
