import { z } from "../deps.ts";

interface BuildArgs<S> {
  create: (
    slug: string,
    item: S,
  ) => Promise<boolean>;
  alreadyExists: (slug: string) => Promise<boolean>;
}

export interface Model<S, Q = undefined> {
  modelName: string;

  schema: z.Schema<S>;

  purgeBeforeBuild?: boolean;

  build: (args: BuildArgs<S>) => Promise<boolean>;

  querySchema?: z.Schema<Q>;

  runQuery?: (
    allItems: Array<S & { slug: string }>,
  ) => (
    parsedQuery: Q,
  ) => Array<S & { slug: string }>;
}
