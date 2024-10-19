import { _common } from "$std/path/_common/common.ts";
import { Image, Post } from "../builtins/index.ts";
import { Model } from "../db/Model.ts";

// deno-lint-ignore no-explicit-any
type AnyModel = Model<any, any>;

export interface WordfreshConfig {
  models: AnyModel[];

  Post: {
    perPage: number;
    dir: string;
  };

  Image: {
    dir: string;
    sizes: number[];
  };
}

export let config: WordfreshConfig;

const DEFAULT_CONFIG: WordfreshConfig = {
  models: [Post, Image],
  Post: {
    perPage: 10,
    dir: "content/posts",
  },
  Image: {
    dir: "content/images",
    sizes: Array(2).fill(null).map((_, idx) => (idx + 1) * 200),
  },
};

export type ConfigSetter =
  | Partial<WordfreshConfig>
  | ((defaultConfig: WordfreshConfig) => WordfreshConfig);

export const setConfig = (
  setConfig: ConfigSetter,
) => {
  config = {
    ...DEFAULT_CONFIG,
    ...setConfig,
  };
  return config;
};
