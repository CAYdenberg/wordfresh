import { FreshContext, Handler } from "$fresh/server.ts";
import { getItem } from "../db/index.ts";
import { z } from "../deps.ts";
import { Model } from "../plugin/Model.ts";
import { HttpError } from "./HttpError.ts";

export const ItemHandler = <S, Q>(model: Model<S, Q>): Handler => {
  const getter = getItem<S, Q>(model);

  return async (_req: Request, ctx: FreshContext) => {
    const slug: string = ctx.params.slug;
    const match = z.string().safeParse(slug);
    if (!match.success) {
      return HttpError(400, "Item ID must be supplied to ItemRoute");
    }

    const result = await getter(match.data);
    if (!result) {
      return HttpError(404, `${model.modelName} with slug ${slug} not found`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };
};
