import { renderToString } from "$fresh/src/server/deps.ts";
import { resolveBlog } from "../builtins/index.ts";
import { resolveWf } from "../db/index.ts";
import { CreateMd } from "../view/index.ts";
import { config } from "../plugin/config.ts";

import type { UserDefinedComponents } from "../view/CreateMd.tsx";

export const JsonFeedHandler = (
  feedUrl: string,
  postsPerPage: number,
  userDefinedComponents: UserDefinedComponents = {},
) =>
async (req: Request) => {
  const { posts, pagination } = await resolveBlog(
    new URL(req.url),
    postsPerPage,
  );
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
