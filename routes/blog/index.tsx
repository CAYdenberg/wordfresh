import { PageProps } from "$fresh/server.ts";
import { Fragment } from "preact/jsx-runtime";
import { resolveBlog, WfHead } from "src";

export default async function PostIndex(
  { url }: PageProps,
) {
  const { posts, pagination } = await resolveBlog(url, 10);

  return (
    <Fragment>
      <WfHead url={url} pageTitle="Blog" pageDescription="This is the blog" />
      <div>
        <ul>
          {posts.map((post) => (
            <li key={post.slug}>{post.title} - {post.slug}</li>
          ))}
        </ul>
        <p>Page {pagination.page} of {pagination.totalPages}</p>
      </div>
    </Fragment>
  );
}
