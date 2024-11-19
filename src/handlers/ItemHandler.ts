import type { FreshContext, Handler } from "$fresh/server.ts";

import { z } from "../deps.ts";
import { Model } from "../db/Model.ts";
import { resolveToHttp, WfError } from "../db/index.ts";

export const ItemHandler = <S, Q>(
  model: Model<S, Q>,
  slugParam = "slug",
): Handler => {
  return async (_req: Request, ctx: FreshContext) => {
    const slug: string = ctx.params[slugParam];
    const match = z.string().safeParse(slug);
    if (!match.success) {
      return new WfError(400, "Item ID must be supplied to ItemRoute").toHttp();
    }

    const resolved = await resolveToHttp({
      modelName: model.modelName,
      slug: match.data,
    });
    return resolved;
  };
};
