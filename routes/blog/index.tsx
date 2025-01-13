import { PageProps } from "$fresh/server.ts";
import { Fragment } from "preact/jsx-runtime";
import { BlogHandler, type BlogHandlerProps, WfHead } from "src";
import { Paginator } from "../../client/Paginator.tsx";

export const handler = BlogHandler(10);

export default function PostIndex(
  { url, data }: PageProps<BlogHandlerProps>,
) {
  const { items: posts, pagination } = data;

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
