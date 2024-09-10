import { Plugin } from "$fresh/server.ts";
import { startDb } from "../db/denoKv.ts";
import { Model } from "./Model.ts";

interface WordfreshConfig {
  models: Model<unknown>[];
}

startDb(await Deno.openKv());

const wordfresh = (config: WordfreshConfig): Plugin => ({
  name: "wordfresh",

  buildStart: () => {
    return Promise.resolve();
  },
});

export default wordfresh;
