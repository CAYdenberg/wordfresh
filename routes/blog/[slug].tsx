import { Handler, PageProps } from "$fresh/server.ts";
import { Fragment } from "preact/jsx-runtime";
import { createMdRenderer, TyPostSchema } from "src";

import Block from "../../islands/Block.tsx";
import { resolvePost } from "../../src/builtins/Post.ts";

interface Props {
  post: TyPostSchema;
}

export const handler: Handler<Props> = async (_, ctx) => {
  const post = await resolvePost(ctx.params);
  if (!post) return ctx.renderNotFound();
  return ctx.render({
    post,
  });
};

const Md = createMdRenderer({
  BlockComponent: Block,
  InlineComponent: ({ children }) => (
    <span style={{ background: "blue", color: "white" }}>{children}</span>
  ),
});

export default function PostSingle({ data }: PageProps<Props>) {
  const { post } = data;

  return (
    <Fragment>
      <h1>{post.title}</h1>
      <h2>{post.date_published}</h2>
      <Md node={post.content} />
    </Fragment>
  );
}
