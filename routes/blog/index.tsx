import { PageProps } from "$fresh/server.ts";
import { resolveBlog } from "src";

export default async function PostIndex(
  { url }: PageProps,
) {
  const { posts, pagination } = await resolveBlog(url);

  return (
    <div>
      <ul>
        {posts.map((post) => <li key={post.slug}>{post.title} - {post.slug}
        </li>)}
      </ul>
      <p>Page {pagination.page} of {pagination.totalPages}</p>
    </div>
  );
}
