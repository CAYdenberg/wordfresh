import { path } from "../deps.ts";

import { Plugin } from "$fresh/server.ts";
import { deleteAll, doBuild, startDb } from "../db/bindings/denoKv.ts";
import { ConfigSetter, setConfig } from "./config.ts";

startDb(await Deno.openKv());

const wordfresh = (config: ConfigSetter): Plugin => {
  const resolvedConfig = setConfig(config);

  return {
    name: "wordfresh",

    buildStart: async () => {
      if (resolvedConfig.purge) {
        await Deno.remove(
          path.join(Deno.cwd(), resolvedConfig.attachmentsDir),
          { recursive: true },
        );

        await Promise.all(resolvedConfig.models.map((model) => {
          deleteAll(model.modelName);
        }));
      }

      await Deno.mkdir(path.join(Deno.cwd(), resolvedConfig.attachmentsDir), {
        recursive: true,
      });

      await Promise.all(resolvedConfig.models.map((model) => {
        console.log(`Building ${model.modelName}...`);
        return doBuild(model);
      }));
    },
  };
};

export default wordfresh;
