import { path } from "./deps.ts";

import { Schema, Model } from "./Model.ts";
import * as db from "./db.ts";
import { slugify as _slugify } from "./deps.ts";

export const slugify = (input: string) =>
  _slugify(input, {
    replacement: "-",
    remove: /[:\,\/\\\'\"\(\)]/,
    lower: true,
  });

export const ingest =
  <S extends Schema>(model: Model<S>) =>
  async (filePath: string) => {
    if (!model.ingest) {
      throw new Error(`Ingest method for model ${model.modelName} not defined`);
    }

    const text = await Deno.readTextFile(filePath);
    const binary = await Deno.readFile(filePath);

    const basename = path.basename(filePath);
    const extname = path.extname(filePath);
    const filename = basename.slice(0, basename.length - extname.length);

    model.ingest({
      filename,
      extension: extname,
      text,
      binary,
      createRecord: (record, opts) => {
        const create = opts?.overwrite
          ? db.forceCreate<S>(model)
          : db.create<S>(model);

        const verified = model.schema.safeParse(record);
        if (!verified.success) {
          console.error(
            `Record $${model.getId(record)} does not match schema for model ${
              model.modelName
            }`,
            verified.error
          );
          return Promise.resolve(false);
        }

        return create(verified.data)
          .then(() => true)
          .catch((e) => {
            console.error(`Error inserting record ${model.getId(record)}`, e);
            return false;
          });
      },
      createFile: (metadata, contentType, binary, opts) => {
        const create = opts?.overwrite
          ? db.forceCreateFile<S>(model)
          : db.createFile<S>(model);

        const verified = model.schema.safeParse(metadata);
        if (!verified.success) {
          console.error(
            `Metadata for file $${model.getId(
              metadata
            )} does not match schema for model ${model.modelName}`,
            verified.error
          );
          return;
        }

        create(verified.data, contentType, binary).catch((e) => {
          console.error(
            `Error creating record for file ${model.getId(metadata)}`,
            e
          );
        });
      },
    });
  };
