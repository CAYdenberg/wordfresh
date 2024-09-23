import { FunctionComponent } from "preact";
import { z, MdastRoot } from "./deps.ts";

import { Model } from "../plugin/Model.ts";
import {
  getPostMetadata,
  getQueries,
} from "../parsers/content/index.ts";
import { getConfig, POSTS_PER_PAGE } from "./mod.ts";
import { paginate } from "./pagination.ts";
import { renderToString } from "preact-render-to-string";
import { path } from "../deps.ts";
import { config } from "../plugin/config.ts";
import { parseMdx } from "../parsers/markdown/parseMdx.ts";

export const PostSchema = z.object({
  slug: z.string(),
  title: z.string().optional(),
  summary: z.string().optional(),
  content: z.any(),
  content_text: z.string().optional(),
  queries: z.array(z.any()),
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
});

export interface Author {
  name?: string;
  url?: string;
  avatar?: string;
}

export interface TPostSchema {
  slug: string;
  title?: string;
  summary?: string;
  content?: MdastRoot;
  content_text?: string;
  image?: string;
  banner_image?: string;
  date_published?: string;
  date_modified?: string;
  external_url?: string;
  author?: Author;
  [key: string]: unknown;
}

export const Post: Model<TPostSchema> = {
  modelName: "post",

  schema: PostSchema,

  build: async ({ create }) => {
    const dir = path.join(Deno.cwd(), config.contentDir, 'posts');

    for await (const dirEntry of dir) {
      const text = await Deno.readTextFile(dirEntry);
      const content = parseMdx(text);
    }
    
    const metadata = getPostMetadata(content);
    const queries = getQueries(content);

    createRecord(
      {
        slug: filename,
        ...metadata,
        content,
        queries,
      },
      {
        overwrite: true,
      }
    );

    return true;
  },

  query: (baseQuery, qs) => {
    const defs: MangoQuery = {
      ...baseQuery,
      skip: 0,
      limit: POSTS_PER_PAGE,
      sort: [{ date_published: "desc" }],
    };

    if (!qs) {
      return defs;
    }

    const params = parseQuery(
      z.object({
        limit: z.coerce.number().optional(),
        skip: z.coerce.number().optional(),
      })
    )(qs);

    if (params.limit) {
      return {
        ...defs,
        ...params,
      };
    }

    return defs;
  },
};

export const createFeedHandler =
  (
    Markdown: FunctionComponent<// deno-lint-ignore no-explicit-any
    { node: MdastNode; queries: ResolvedIsoquery<any>[] }>
  ) =>
  async (req: Request) => {
    const config = getConfig();
    const paged = paginate(20)(req.url);
    const posts = await db.modelQuery(Post)(
      `limit=20&skip=${paged.params.skip}`
    );
    const isoquery = Isoquery(...(config.models || []));

    // TODO: content_html: preact render to string; remove whitespace and escape
    // line endings (JSON.stringify may do that automatically?)
    const feed = {
      version: "https://jsonfeed.org/version/1",
      title: config.siteTitle,
      home_page_url: config.siteUrl,
      feed_url: `${config.siteUrl}/feed.json`,
      description: config.siteDescription,
      favicon: `${config.siteUrl}/favicon.ico`,
      author: config.siteFeedAuthor,
      next_url: posts.length < 20 ? undefined : paged.url.next,
      items: await Promise.all(
        posts.map((post) => {
          return isoquery.resolve(post.queries).then((queries) => {
            return {
              id: post.slug,
              url: `${config.siteUrl}/blog/${post.slug}`,
              title: post.title,
              content_text: post.content_text,
              content_html: post.content
                ? renderToString(
                    <Markdown node={post.content} queries={queries} />
                  )
                : null,
              summary: post.summary || post.content_text?.slice(0, 240),
              image: post.image,
              banner_image: post.banner_image,
              date_published: post.date_published,
              author: post.author || config.siteFeedAuthor,
            };
          });
        })
      ),
    };

    return new Response(JSON.stringify(feed), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };
