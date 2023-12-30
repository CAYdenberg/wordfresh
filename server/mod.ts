import { Author, Post } from "./Post.tsx";
import { Image } from "./Image.ts";
import { Model, Schema } from "./Model.ts";
import { provision } from "./db.ts";
import * as path from "path";
import { ingest } from "./ingest.ts";

// external API

// database, models, queries
export { getQueries } from "./content/index.ts";
export type { Model, Schema, WithSlug } from "./Model.ts";
export { Isoquery } from "./Isoquery.ts";
export type { ResolvedIsoquery } from "./Isoquery.ts";
export * as db from "./db.ts";
export { getRecordHandler } from "./getRecordHandler.ts";

// built-in models
export type { TPostSchema } from "./Post.tsx";
export { Post } from "./Post.tsx";
export type { TImageSchema } from "./Image.ts";
export { Image } from "./Image.ts";

// handlers
export { createFeedHandler } from "./Post.tsx";
export { imageHandler } from "./Image.ts";

// helpers
export { slugify } from "./ingest.ts";
export { parseQuery } from "./Isoquery.ts";
export type { Pagination } from "./pagination.ts";
export { paginate } from "./pagination.ts";

// content
export { parseMd } from "./content/index.ts";
export type { MdastNode } from "./content/index.ts";

// serverside components
export { Page } from "./Page.tsx";
export { createMdComponent } from "./content/content.tsx";

// hooks - import directly from './hooks'
// components - import directly from './components'

// config: for internal use
// TODO configure in userland
export const POSTS_PER_PAGE = 10;
export const THUMBNAIL_WIDTH = 300;
export const OG_WIDTH = 1200;

export interface Config {
  dbBaseUrl: string;
  dbName: string;
  projectId: string;
  siteUrl: string;
  siteTitle: string;
  siteDescription: string;
  siteDefaultPostImage?: string | string[];
  siteDefaultBannerImages?: string;
  siteFeedAuthor?: Author;
  // deno-lint-ignore no-explicit-any
  models?: Array<Model<any>>;
}

let CONFIG: Config;

export const createWordfresh = (config: Config) => {
  CONFIG = config;

  const allModels = (
    CONFIG.models ? [Post, Image, ...CONFIG.models] : [Post, Image]
  ) as Array<Model<Schema>>;

  return {
    CONFIG,
    task: (...args: string[]) => {
      switch (args[0]) {
        case "provision": {
          provision(allModels);
          return;
        }

        case "ingest": {
          const [_, modelName, file] = args;
          const model = allModels.find((item) => item.modelName === modelName);
          if (!model) {
            throw new Error(`Model for modelName ${modelName} not found`);
          }
          const fullPath = path.join(Deno.cwd(), file);
          ingest(model)(fullPath);
          return;
        }
      }

      throw new Error(`Task ${args[0]} not recognized`);
    },
  };
};

export const getConfig = (): Config => {
  if (!CONFIG) {
    throw new Error("Run createWordfresh prior to getConfig");
  }
  return CONFIG;
};
