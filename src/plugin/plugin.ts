import { Plugin } from "$fresh/server.ts";
import { startDb } from "../db/denoKv.ts";
import { WordfreshConfig, setConfig } from "./config.ts";

startDb(await Deno.openKv());

const wordfresh = (config: Partial<WordfreshConfig>): Plugin => {
  setConfig(config);

  return {
    name: "wordfresh",

    buildStart: () => {
      return Promise.resolve();
    },
  };
};

export default wordfresh;
