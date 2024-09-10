import { Handler } from "$fresh/server.ts";
import { Speaking, TSpeakingSchema } from "../../../models/Speaking.ts";

const db: Record<string, TSpeakingSchema> = {};
const create = (slug: string, item: TSpeakingSchema) => {
  db[slug] = item;
  return Promise.resolve(true);
};

export const handler: Handler = async () => {
  await Speaking.build({ create });

  return new Response(JSON.stringify(db), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
