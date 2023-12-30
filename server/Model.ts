import { z } from "./deps.ts";

interface CouchFields {
  _id: string;
  _rev?: string;
  modelName: string;
}

export type WithCouch<S> = S & CouchFields;

export type WithSlug<S> = S & { slug: string };

type Ops = "$eq" | "$gt" | "$lt" | "$eq" | "$gte" | "$lte" | "$ne";

type Primative = string | number | boolean | null;

interface IngestArgs<S> {
  filename: string;
  extension: string;
  text: string;
  binary: Uint8Array;
  createRecord: (
    doc: S,
    opts?: {
      overwrite?: boolean;
    }
  ) => Promise<boolean>;
  createFile: (
    metadata: S,
    contentType: string,
    binary: Uint8Array,
    opts?: {
      overwrite?: boolean;
    }
  ) => void;
}

export interface MangoQuery {
  selector?: Record<
    string,
    Primative | { [key in Ops]?: Primative } | undefined
  >;
  limit?: number;
  skip?: number;
  sort?: Record<string, "asc" | "desc">[];
}

export type Schema = Record<string, unknown>;

export interface Model<S extends Schema> {
  modelName: string;

  schema: z.Schema<S>;

  getId: (thing: S) => string;

  index?: string | string[];

  ingest?: (ingestArgs: IngestArgs<S>) => void;

  query?: (baseQuery: MangoQuery, qs?: string) => MangoQuery;
}
