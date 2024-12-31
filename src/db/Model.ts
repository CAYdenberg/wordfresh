import { z } from "../deps.ts";

export const Attachment = () =>
  z.object({
    isWfAttachment: z.literal(true),
    filename: z.string(),
  });

export type TyAttachment = z.infer<ReturnType<typeof Attachment>>;

interface BuildArgs<S> {
  create: (
    slug: string,
    item: S,
  ) => Promise<boolean>;

  createAttachment: (
    filename: string,
    data: Uint8Array,
  ) => Promise<TyAttachment>;

  getExisting: (slug: string) => Promise<S | null>;
}

export interface Model<S, Q = undefined> {
  modelName: string;

  schema: z.Schema<S>;

  build: (args: BuildArgs<S>) => Promise<boolean>;

  querySchema?: z.Schema<Q>;

  runQuery?: (
    allItems: Array<S & { slug: string }>,
  ) => (
    parsedQuery: Q,
  ) => Array<S & { slug: string }>;
}
