/// <reference lib="deno.unstable" />

import { Model } from "../plugin/Model.ts";

let kv: Deno.Kv = await Deno.openKv(":memory:");

export const startDb = (db?: Deno.Kv) => {
  if (db) {
    kv = db;
  }
};

const builds: Record<string, boolean> = {};

export const doBuild = <S, Q>(model: Model<S, Q>) => {
  const create = (slug: string, item: S) => {
    const match = model.schema.safeParse(item);
    if (match.success) {
      return kv.set([model.modelName, slug], match.data).then(() => {
        return true;
      });
    }
    throw match.error;
  };

  return model.build({ create }).then((allGood) => {
    if (allGood) {
      builds[model.modelName] = true;
    }
    return allGood;
  });
};

export const getItem =
  <S, Q>(model: Model<S, Q>) => async (id: string): Promise<S | null> => {
    if (!builds[model.modelName]) {
      await doBuild(model);
    }

    const result = await kv.get<S>([model.modelName, id]);
    return result ? result.value : null;
  };

export const getAll =
  <S, Q>(model: Model<S, Q>) => async (): Promise<
    Array<S & { id: string }>
  > => {
    if (!builds[model.modelName]) {
      await doBuild(model);
    }

    const all = kv.list<S>({ prefix: [model.modelName] });
    const results: Array<S & { id: string }> = [];
    for await (const item of all) {
      results.push({ ...item.value, id: item.key[1] as string });
    }
    return results;
  };
