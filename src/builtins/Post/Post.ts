import { path, z } from "../../deps.ts";
import { config } from "../../plugin/config.ts";
import {
  getPostMetadata,
  getWfRequests,
  parseMd,
  slugFromFilename,
} from "../../parsers/index.ts";
import type { Mdast } from "../../parsers/index.ts";

import type { Model } from "../../db/index.ts";

export const PostSchema = z.object({
  slug: z.string(),
  title: z.string().optional(),
  summary: z.string().optional(),
  content: z.unknown(),
  content_text: z.string().optional(),
  image: z.string().optional(),
  banner_image: z.string().optional(),
  date_published: z.string().optional(),
  date_modified: z.string().optional(),
  external_url: z.string().optional(),
  author: z
    .object({
      name: z.string().optional(),
      url: z.string().optional(),
      avatar: z.string().optional(),
    })
    .optional(),
  wf: z.array(z.string()),
});

export interface Author {
  name?: string;
  url?: string;
  avatar?: string;
}

export interface TyPostSchema extends z.infer<typeof PostSchema> {
  content: Mdast.Root;
}

export const PostQuerySchema = z.object({
  page: z.coerce.number().optional(),
});

export type TyPostQuery = z.infer<typeof PostQuerySchema>;

export const Post: Model<TyPostSchema, TyPostQuery> = {
  modelName: "post",

  /**
   * Using any here because the typing of MdastNode is too complex for Zod.
   */
  // deno-lint-ignore no-explicit-any
  schema: PostSchema as any,

  purgeBeforeBuild: true,

  build: async ({ create }) => {
    const dirPath = path.join(Deno.cwd(), config.Post.dir);
    const dir = Deno.readDir(dirPath);

    for await (const dirEntry of dir) {
      if (!dirEntry.isFile) {
        continue;
      }
      const filePath = path.join(dirPath, dirEntry.name);
      const text = await Deno.readTextFile(filePath);
      const slug = slugFromFilename(dirEntry.name);
      try {
        const content = parseMd(text);
        const metadata = getPostMetadata(content);
        const wf = getWfRequests(content);
        await create(slug, {
          slug,
          ...metadata,
          wf,
          content,
        });
      } catch (err) {
        throw new Error(
          `Unable to parse MD from file ${filePath}: ${(err as Error).message}`,
        );
      }
    }

    return true;
  },

  querySchema: PostQuerySchema,

  runQuery: (posts) => () => {
    return posts.filter((post) => !!post.date_published);
  },
};
