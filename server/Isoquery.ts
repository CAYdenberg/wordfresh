import { FreshContext, z, parse } from "./deps.ts";

import { Model, WithSlug } from "./Model.ts";
import { getRecord, modelQuery } from "./db.ts";

export interface Isoquery {
  modelName: string;
  slug?: string;
  query?: string;
}

export interface ResolvedIsoquery<D> extends Isoquery {
  results: WithSlug<D>[];
  timestamp: number;
  error?: boolean;
}

export const parseQuery =
  <Q>(schema: z.Schema<Q>) =>
  (query: string) => {
    const params = parse(query, { arrayFormat: "comma" });
    const result = schema.parse(params);
    return result;
  };

// TODO: cache query results
// deno-lint-ignore no-explicit-any
export const Isoquery = <S>(...models: Model<any>[]) => {
  const resolveQuery = ({
    modelName,
    slug,
    query,
  }: Isoquery): Promise<WithSlug<S>[]> => {
    const model = models.find((model) => model.modelName === modelName);

    if (!model) {
      throw new Error(`Model ${modelName} not defined in isoquery`);
    }

    if (slug) {
      // cast the result into an array for the sake of type consistency
      return Promise.all(
        slug.split(",").map((slug) => getRecord(model)(slug.trim()))
      );
    }

    return modelQuery(model)(query);
  };

  const resolve = (
    queries?: Isoquery | Isoquery[]
  ): Promise<ResolvedIsoquery<S>[]> => {
    if (!queries) return Promise.resolve([]);

    if (Array.isArray(queries)) {
      return Promise.all(
        queries.map((query) =>
          resolveQuery(query)
            .then((results) => ({
              ...query,
              results,
              timestamp: Date.now(),
            }))
            .catch(() => ({
              ...query,
              results: [],
              error: true,
              timestamp: Date.now(),
            }))
        )
      );
    }

    return resolve([queries]);
  };

  const handler = async (
    req: Request,
    ctx: FreshContext
  ): Promise<Response> => {
    const modelName = ctx.params.modelName;
    const slug: string | undefined = ctx.params.slug;
    const query: string | undefined = new URL(req.url).search;
    const result = await resolve({ modelName, slug, query });

    if (!result.length) {
      return new Response("", {
        status: 404,
      });
    }

    if (result[0].error) {
      return new Response("", {
        status: 400,
      });
    }

    return new Response(JSON.stringify(result[0].results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return {
    resolve,
    handler,
  };
};
