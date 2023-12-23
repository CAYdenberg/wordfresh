import { HandlerContext } from "$fresh/server.ts";
import { Model } from "./Model.ts";
import { db, slugify } from "./mod.ts";

// deno-lint-ignore no-explicit-any
export const getRecordHandler = (...models: Model<any>[]) => {
  const handler = async (
    _req: Request,
    ctx: HandlerContext
  ): Promise<Response> => {
    const modelName: string | undefined = ctx.params.modelName;

    const model = models.find((model) => model.modelName === modelName);
    if (!model) {
      return new Response(
        `{ error: 'Query for model ${modelName} not allowed' }`,
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const slugs = ctx.params.slug.split(",");

    if (slugs.length === 0) {
      return new Response("{ error: 'No slug supplied' }", {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const getRecord = db.getRecord(model);

    const results = await Promise.all(
      slugs.map((slug) => getRecord(slugify(slug)))
    );
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return handler;
};
