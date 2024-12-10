import {
  type FreshContext,
  type Handler,
  path,
  renderToString,
  z,
} from "../deps.ts";

import type { TyImageSchema } from "../builtins/Image/index.ts";
import type { TyPostSchema } from "../builtins/index.ts";
import { WfError } from "../db/WfError.ts";
import { config } from "../plugin/config.ts";
import { parseQuery } from "../parsers/index.ts";

import {
  createItemPipeline,
  createQueryPipeline,
  paginate,
  type Pagination,
} from "./pipeline.ts";
import { resolveWf } from "../db/index.ts";
import { CreateMd, type UserDefinedComponents } from "../view/CreateMd.tsx";
import type { AnyWfGetResolved } from "../db/WfGet.ts";

export interface BlogHandlerProps {
  items: TyPostSchema[];
  pagination: Pagination;
}

export const BlogHandler =
  (postsPerPage: number): Handler<BlogHandlerProps> => (req, ctx) => {
    return createQueryPipeline("post", req, ctx).pipe(paginate(postsPerPage))
      .render();
  };

export const getBlogProps = async (
  postsPerPage: number,
  request: Request,
  context: FreshContext,
): Promise<BlogHandlerProps> => {
  const stem = createQueryPipeline<TyPostSchema>("post", request, context).pipe(
    paginate(postsPerPage),
  );

  const items = await stem.data();
  const pagination = await stem.pagination();

  return {
    items,
    pagination,
  };
};

export interface PostHandlerProps {
  post: TyPostSchema;
  wfData: Record<string, AnyWfGetResolved>;
}

export const PostHandler =
  (): Handler<PostHandlerProps> => (request, context) => {
    return createItemPipeline<TyPostSchema>("post", request, context)
      .toResponse(async (wfGet) => {
        if (!wfGet.data) {
          return context.renderNotFound();
        }
        const wfData = await resolveWf(...wfGet.data.wf);
        return context.render({
          post: wfGet.data,
          wfData,
        });
      });
  };

export const getPostProps = async (request: Request, context: FreshContext) => {
  const post = await createItemPipeline<TyPostSchema>("post", request, context)
    .data();
  const wfData = await resolveWf(...post.wf);
  return {
    post,
    wfData,
  };
};

export const JsonFeedHandler = (
  feedUrl: string,
  postsPerPage: number,
  userDefinedComponents: UserDefinedComponents = {},
): Handler =>
async (req, ctx) => {
  const pipeline = createQueryPipeline<TyPostSchema>("post", req, ctx)
    .pipe(paginate(postsPerPage));

  const posts = await pipeline.data();
  const pagination = await pipeline.pagination();

  const Md = CreateMd(userDefinedComponents);

  // TODO: content_html: preact render to string; remove whitespace and escape
  // line endings (JSON.stringify may do that automatically?)
  const feed = {
    version: "https://jsonfeed.org/version/1",
    title: config.siteTitle,
    home_page_url: config.siteUrl,
    feed_url: feedUrl,
    description: config.siteDescription,
    favicon: config.siteUrl ? `${config.siteUrl}/favicon.ico` : undefined,
    author: config.siteMainAuthor,
    next_url: posts.length < postsPerPage ? undefined : pagination.url.next,
    items: await Promise.all(posts.map((post) => {
      return resolveWf(...post.wf).then((wfData) => {
        return {
          id: post.slug,
          url: `${config.siteUrl}/blog/${post.slug}`,
          title: post.title,
          content_text: post.content_text,
          content_html: post.content
            ? renderToString(
              <Md node={post.content} wfData={wfData} />,
            )
            : null,
          summary: post.summary || post.content_text?.slice(0, 240),
          image: post.image,
          banner_image: post.banner_image,
          date_published: post.date_published,
          author: post.author || config.siteMainAuthor,
        };
      });
    })),
  };

  return new Response(JSON.stringify(feed), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const ImageHandler = (
  slugParam = "slug",
  widthQueryParam = "width",
): Handler => {
  const parser = parseQuery(z.object({
    [widthQueryParam]: z.union([
      z.coerce.number(),
      z.enum(["smallest", "largest"]),
    ]).optional(),
  }));

  return (request, context) => {
    let width: number | null;
    try {
      const parsedQuery = parser(new URL(request.url).search);
      const queryWidth = parsedQuery[widthQueryParam];
      width = typeof queryWidth === "number"
        ? queryWidth
        : queryWidth === "smallest"
        ? 0
        : null;
    } catch (_err) {
      return new WfError(
        400,
        "Invalid query width param supplied to Image route",
      ).toHttp();
    }

    return createItemPipeline<TyImageSchema>(
      "image",
      request,
      context,
      slugParam,
    )
      .toResponse(async (wfGet) => {
        const imageData = wfGet.data;
        if (!imageData) {
          throw new WfError(404);
        }
        const sizes = imageData.sizes.slice().sort((a, b) => a - b);
        const size = sizes.find((size) => width !== null && size >= width) ||
          sizes[sizes.length - 1];
        const filename = `${wfGet.slug}_${size}.${imageData.format}`;
        const filepath = path.join(Deno.cwd(), config.Image.outDir, filename);
        const file = await Deno.open(filepath, { read: true });
        return new Response(file.readable);
      });
  };
};
