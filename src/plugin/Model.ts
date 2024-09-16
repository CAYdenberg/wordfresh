import { z } from "zod";

interface BuildArgs<S> {
  create: (
    id: string,
    item: S,
  ) => Promise<boolean>;
}

export interface Model<S, Q = undefined> {
  modelName: string;

  schema: z.Schema<S>;

  build: (args: BuildArgs<S>) => Promise<boolean>;

  querySchema?: z.Schema<Q>;

  runQuery?: (
    allItems: Array<S & { id: string }>,
  ) => (
    parsedQuery: Q,
  ) => Array<S & { id: string }>;
}
