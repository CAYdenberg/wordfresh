import { path, z } from "../deps.ts";
import { getPostMetadata, parseMdx } from "../parsers/index.ts";
import { slugFromFilename } from "../parsers/slugify.ts";
import { Model } from "../db/Model.ts";
import { config } from "../plugin/config.ts";
import { parseQuery } from "../parsers/parseQuery.ts";
import { paginate } from "../handlers/index.ts";
import { getAll, getItem } from "../db/bindings/denoKv.ts";

export const PostSchema = z.object({
  slug: z.string(),
  title: z.string().optional(),
  summary: z.string().optional(),
  content: z.any(),
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
});

export interface Author {
  name?: string;
  url?: string;
  avatar?: string;
}

export type TyPostSchema = z.infer<typeof PostSchema>;

export const PostQuerySchema = z.object({
  page: z.number().optional(),
});

export type TyPostQuery = z.infer<typeof PostQuerySchema>;

export const Post: Model<TyPostSchema, TyPostQuery> = {
  modelName: "post",

  schema: PostSchema,

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
        const content = parseMdx(text);
        const metadata = getPostMetadata(content);
        await create(slug, {
          slug,
          ...metadata,
          content,
        });
      } catch (err) {
        throw new Error(`Unable to parse MDX from file ${filePath}`, err);
      }
    }

    return true;
  },

  querySchema: PostQuerySchema,

  runQuery: (posts) => () => {
    return posts.filter((post) => !!post.date_published);
  },
};

export const resolveBlog = async (url: URL) => {
  let queryParams: TyPostQuery;

  try {
    queryParams = parseQuery(PostQuerySchema)(url.search);
  } catch (_err: unknown) {
    queryParams = {
      page: 1,
    };
  }

  const posts = await getAll<TyPostSchema, TyPostQuery>(Post)();
  const publishedPosts = Post.runQuery!(posts)(queryParams);
  const pagination = paginate(config.Post.perPage, publishedPosts.length)(
    url,
  );
  const postsThisPage = publishedPosts.slice(
    pagination.params.skip,
    pagination.params.skip + pagination.params.limit,
  );

  return {
    posts: postsThisPage,
    pagination,
  };
};

export const resolvePost = async (params: Record<string, string>) => {
  const slug = params.slug;
  if (!slug) return null;

  const post = await getItem(Post)(slug);
  return post || null;
};

// export const createFeedHandler =
//   (
//     Markdown: FunctionComponent<// deno-lint-ignore no-explicit-any
//     { node: MdastNode; queries: ResolvedIsoquery<any>[] }>
//   ) =>
//   async (req: Request) => {
//     const config = getConfig();
//     const paged = paginate(20)(req.url);
//     const posts = await db.modelQuery(Post)(
//       `limit=20&skip=${paged.params.skip}`
//     );
//     const isoquery = Isoquery(...(config.models || []));

//     // TODO: content_html: preact render to string; remove whitespace and escape
//     // line endings (JSON.stringify may do that automatically?)
//     const feed = {
//       version: "https://jsonfeed.org/version/1",
//       title: config.siteTitle,
//       home_page_url: config.siteUrl,
//       feed_url: `${config.siteUrl}/feed.json`,
//       description: config.siteDescription,
//       favicon: `${config.siteUrl}/favicon.ico`,
//       author: config.siteFeedAuthor,
//       next_url: posts.length < 20 ? undefined : paged.url.next,
//       items: await Promise.all(
//         posts.map((post) => {
//           return isoquery.resolve(post.queries).then((queries) => {
//             return {
//               id: post.slug,
//               url: `${config.siteUrl}/blog/${post.slug}`,
//               title: post.title,
//               content_text: post.content_text,
//               content_html: post.content
//                 ? renderToString(
//                     <Markdown node={post.content} queries={queries} />
//                   )
//                 : null,
//               summary: post.summary || post.content_text?.slice(0, 240),
//               image: post.image,
//               banner_image: post.banner_image,
//               date_published: post.date_published,
//               author: post.author || config.siteFeedAuthor,
//             };
//           });
//         })
//       ),
//     };

//     return new Response(JSON.stringify(feed), {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   };
