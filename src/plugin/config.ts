import { Post } from "../builtins/Post.ts";
import { Model } from "../db/Model.ts";

// deno-lint-ignore no-explicit-any
type AnyModel = Model<any, any>;

export interface WordfreshConfig {
  models: AnyModel[];

  postsPerPage: number;

  contentDir: string;
}

export let config: WordfreshConfig;

const DEFAULT_CONFIG: WordfreshConfig = {
  models: [Post],
  postsPerPage: 10,
  contentDir: "content",
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
