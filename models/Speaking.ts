import { Model, slugify } from "src";
import { z } from "zod";

export const SpeakingSchema = z.object({
  title: z.string(),
  summary: z.string(),
  slidesUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  date: z.string(),
  img: z.string().optional(),
});

export type TSpeakingSchema = z.infer<typeof SpeakingSchema>;

export const Speaking: Model<z.infer<typeof SpeakingSchema>> = {
  modelName: "speaking",

  schema: SpeakingSchema,

  build: async ({ create }) => {
    const text = await Deno.readTextFile("content/speaking.json");
    const items: TSpeakingSchema[] = JSON.parse(text);
    items.forEach((item) => create(slugify(item.title), item));
    return true;
  },
};
