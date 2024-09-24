import { Handler, PageProps } from "$fresh/server.ts";
import { Post, TPostSchema } from "../../src/models/Post.ts";
import { getItem } from "../../src/db/denoKv.ts";
import { Fragment } from "preact/jsx-runtime";

interface Data {
  post: TPostSchema | null;
}

export const handler: Handler<Data> = async (req, ctx) => {
  const slug = ctx.params.slug;
  const post = await getItem(Post)(slug);

  return ctx.render({
    post,
  });
};

export default function PostSingle({ data, url }: PageProps<Data>) {
  if (!data.post) {
    return <h1>Post not found</h1>;
  }

  return (
    <Fragment>
      <h1>This is the title of the post {data.post.title}</h1>
    </Fragment>
  );
}
