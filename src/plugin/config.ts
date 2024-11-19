import { _common } from "$std/path/_common/common.ts";
import { Image, Post } from "../builtins/index.ts";
import type { Author } from "../builtins/Post/Post.ts";
import { Model } from "../db/Model.ts";

// deno-lint-ignore no-explicit-any
type AnyModel = Model<any, any>;

export interface WordfreshConfig {
  models: AnyModel[];
  purgeAll: boolean;
  developerWarnings: boolean;

  siteUrl?: string;
  siteTitle?: string;
  siteDescription?: string;
  siteMainAuthor?: Author;

  Post: {
    dir: string;
    feedUrl?: string;
  };

  Image: {
    dir: string;
    outDir: string;
    sizes: number[];
  };

  favicon: string;
}

const DEFAULT_CONFIG: WordfreshConfig = {
  models: [Post, Image],
  developerWarnings: true,
  purgeAll: false,
  Post: {
    dir: "content/posts",
  },
  Image: {
    dir: "content/images",
    sizes: Array(10).fill(null).map((_, idx) => (idx + 1) * 200),
    outDir: "static/_wf",
  },
  favicon: "/favicon.ico",
};

export type ConfigSetter =
  | Partial<WordfreshConfig>
  | ((defaultConfig: WordfreshConfig) => WordfreshConfig);

export let config: WordfreshConfig = DEFAULT_CONFIG;

export const setConfig = (
  setConfig: ConfigSetter,
) => {
  if (typeof setConfig === "function") {
    config = setConfig(DEFAULT_CONFIG);
    return config;
  }
  config = {
    ...DEFAULT_CONFIG,
    ...setConfig,
  };
  return config;
};
