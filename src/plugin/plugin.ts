import { Plugin } from "$fresh/server.ts";
import { startDb } from "../db/bindings/denoKv.ts";
import { ConfigSetter, setConfig } from "./config.ts";

startDb(await Deno.openKv());

const wordfresh = (config: ConfigSetter): Plugin => {
  setConfig(config);

  return {
    name: "wordfresh",

    buildStart: () => {
      return Promise.resolve();
    },
  };
};

export default wordfresh;
