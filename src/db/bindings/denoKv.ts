/// <reference lib="deno.unstable" />

import { Model } from "../Model.ts";
import { isBuilt, markBuild } from "../Build.ts";
import { config } from "../../plugin/config.ts";

let kv: Deno.Kv = await Deno.openKv(":memory:");

export const startDb = (db?: Deno.Kv) => {
  if (db) {
    kv = db;
  }
};

export const deleteAll = async (modelName: string) => {
  const all = kv.list({ prefix: [modelName] });
  for await (const item of all) {
    kv.delete(item.key);
  }
  return true;
};

export const doBuild = async <S, Q>(
  model: Model<S, Q>,
) => {
  const create = (slug: string, item: S) => {
    const match = model.schema.safeParse(item);
    if (match.success) {
      return kv.set([model.modelName, slug], match.data).then(() => {
        return true;
      });
    }
    throw match.error;
  };

  const purge = model.purgeBeforeBuild || config.purgeAll;

  if (purge) {
    await deleteAll(model.modelName);
  }

  const alreadyExists = async (id: string) => {
    if (purge) return false;
    const result = await kv.get<S>([model.modelName, id]);
    return !!result;
  };

  const allGood = await model.build({ create, alreadyExists });
  if (allGood) {
    markBuild(model.modelName);
  }
  return allGood;
};

export const getItem =
  <S, Q>(model: Model<S, Q>) => async (id: string): Promise<S | null> => {
    if (!isBuilt(model.modelName)) {
      await doBuild(model);
    }

    const result = await kv.get<S>([model.modelName, id]);
    return result ? result.value : null;
  };

export const getAll = <S, Q>(model: Model<S, Q>) =>
async (): Promise<
  Array<S & { id: string }>
> => {
  if (!isBuilt(model.modelName)) {
    await doBuild(model);
  }

  const all = kv.list<S>({ prefix: [model.modelName] });
  const results: Array<S & { id: string }> = [];
  for await (const item of all) {
    results.push({ ...item.value, id: item.key[1] as string });
  }
  return results;
};
