import { Post } from "../models/Post.ts";
import { Model } from "./Model.ts";

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

export const setConfig = (setConfig: Partial<WordfreshConfig>) => {
  config = {
    ...DEFAULT_CONFIG,
    ...setConfig,
  };
  return config;
};
