import { _common } from "$std/path/_common/common.ts";
import { Image, Post } from "../builtins/index.ts";
import { Model } from "../db/Model.ts";

// deno-lint-ignore no-explicit-any
type AnyModel = Model<any, any>;

export interface WordfreshConfig {
  models: AnyModel[];
  purgeAll: boolean;

  Post: {
    perPage: number;
    dir: string;
  };

  Image: {
    dir: string;
    outDir: string;
    sizes: number[];
  };
}

const DEFAULT_CONFIG: WordfreshConfig = {
  models: [Post, Image],
  purgeAll: false,
  Post: {
    perPage: 10,
    dir: "content/posts",
  },
  Image: {
    dir: "content/images",
    sizes: Array(10).fill(null).map((_, idx) => (idx + 1) * 200),
    outDir: "static/_img",
  },
};

export type ConfigSetter =
  | Partial<WordfreshConfig>
  | ((defaultConfig: WordfreshConfig) => WordfreshConfig);

export let config: WordfreshConfig;

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
