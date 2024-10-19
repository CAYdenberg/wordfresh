import { Plugin } from "$fresh/server.ts";
import { doBuild, startDb } from "../db/bindings/denoKv.ts";
import { ConfigSetter, setConfig } from "./config.ts";

startDb(await Deno.openKv());

const wordfresh = (config: ConfigSetter): Plugin => {
  const resolvedConfig = setConfig(config);

  return {
    name: "wordfresh",

    buildStart: () => {
      return Promise.all(resolvedConfig.models.map((model) => {
        console.log(`Building ${model.modelName}...`);
        return doBuild(model);
      }))
        .then(() => {
          return;
        });
    },
  };
};

export default wordfresh;
