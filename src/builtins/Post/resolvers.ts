import { getAll, getItem } from "../../db/bindings/denoKv.ts";

import { parseQuery } from "../../parsers/index.ts";
import { paginate } from "./paginate.ts";

import { resolveWf } from "../../db/index.ts";
import type { AnyWfGetResolved } from "../../db/WfGet.ts";
import {
  Post,
  PostQuerySchema,
  type TyPostQuery,
  type TyPostSchema,
} from "./Post.ts";

export const resolveBlog = async (url: URL, postsPerPage: number) => {
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
  const pagination = paginate(postsPerPage, publishedPosts.length)(
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

export interface ResolvedPost {
  post: TyPostSchema;
  wfData: Record<string, AnyWfGetResolved>;
}

export const resolvePost = async (
  params: Record<string, string>,
): Promise<ResolvedPost | null> => {
  const slug = params.slug;
  if (!slug) return null;

  const post = await getItem(Post)(slug);
  if (!post) return null;

  const wfData = await resolveWf(...post.wf);

  return { post, wfData };
};
