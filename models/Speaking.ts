import { Model, slugify } from "src";
import { z } from "zod";
import { datetime } from "../src/deps.ts";

export const SpeakingSchema = z.object({
  title: z.string(),
  summary: z.string(),
  slidesUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  date: z.string().date(),
  img: z.string().optional(),
});

export type TySpeakingSchema = z.infer<typeof SpeakingSchema>;

export const SpeakingQuery = z.object({
  before: z.string().date().optional(),
  after: z.string().date().optional(),
});

export type TySpeakingQuery = z.infer<typeof SpeakingQuery>;

export const Speaking: Model<TySpeakingSchema, TySpeakingQuery> = {
  modelName: "speaking",

  schema: SpeakingSchema,

  build: async ({ create }) => {
    const text = await Deno.readTextFile("content/speaking.json");
    const items: TySpeakingSchema[] = JSON.parse(text);

    items.forEach((item) => create(slugify(item.title), item));
    return true;
  },

  querySchema: SpeakingQuery,

  runQuery: (items) => ({ before, after }) => {
    return items.filter((item) => {
      if (!before) return true;
      return datetime(item.date).isBefore(datetime(before));
    }).filter((item) => {
      if (!after) return true;
      return datetime(item.date).isAfter(datetime(after));
    }).sort((a, b) => {
      return datetime(a.date).isBefore(datetime(b.date)) ? 1 : -1;
    });
  },
};
