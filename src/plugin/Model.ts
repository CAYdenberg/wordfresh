import { z } from "zod";

interface BuildArgs<S> {
  create: (
    id: string,
    item: S,
  ) => Promise<boolean>;
}

export interface Model<S> {
  modelName: string;

  schema: z.Schema<S>;

  build: (args: BuildArgs<S>) => Promise<boolean>;

  query?: (query?: string) => Promise<S & { id: string }>;
}
