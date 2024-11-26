import { PageProps } from "$fresh/server.ts";
import { Fragment } from "preact/jsx-runtime";
import { resolveBlog, WfHead } from "src";
import { Paginator } from "src/client/Paginator.tsx";

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
        <Paginator
          {...pagination}
          className={{
            root: "flex flex-row items-center",
            button: "text-[3rem] text-[blue]",
            disabledButton: "text-gray-400",
            text: "m-0 flex-grow text-center",
          }}
        />
      </div>
    </Fragment>
  );
}
