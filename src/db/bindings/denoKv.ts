/// <reference lib="deno.unstable" />

import { path } from "../../deps.ts";

import { Model } from "../Model.ts";
import { isBuilt, markBuild } from "../Build.ts";
import { config } from "../../plugin/config.ts";

let kv: Deno.Kv;

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
  buildAttachments: boolean,
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

  const createAttachment = async (filename: string, data: Uint8Array) => {
    if (!buildAttachments) {
      return {
        isWfAttachment: true as const,
        filename,
      };
    }

    const destPath = path.join(Deno.cwd(), config.attachmentsDir, filename);
    await Deno.writeFile(destPath, data);
    return {
      isWfAttachment: true as const,
      filename,
    };
  };

  const getExisting = async (slug: string) => {
    const result = await kv.get<S>([model.modelName, slug]);
    return result.value || null;
  };

  const allGood = await model.build({ create, createAttachment, getExisting });
  if (allGood) {
    markBuild(model.modelName);
  }
  return allGood;
};

export const getItem =
  <S, Q>(model: Model<S, Q>) => async (slug: string): Promise<S | null> => {
    if (!isBuilt(model.modelName)) {
      await doBuild(model, config.buildAttachments);
    }

    const result = await kv.get<S>([model.modelName, slug]);
    return result ? result.value : null;
  };

export const getAll = <S, Q>(model: Model<S, Q>) =>
async (): Promise<
  Array<S & { slug: string }>
> => {
  if (!isBuilt(model.modelName)) {
    await doBuild(model, config.buildAttachments);
  }

  const all = kv.list<S>({ prefix: [model.modelName] });
  const results: Array<S & { slug: string }> = [];
  for await (const item of all) {
    results.push({ ...item.value, slug: item.key[1] as string });
  }
  return results;
};
