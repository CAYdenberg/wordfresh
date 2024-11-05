import { Handler, PageProps } from "$fresh/server.ts";
import { Fragment } from "preact/jsx-runtime";
import { createMdRenderer, ResolvedPost, resolvePost } from "src";

import Block from "../../islands/Block.tsx";
import BlockWithData from "../../islands/BlockWithData.tsx";

type Props = ResolvedPost;

export const handler: Handler<Props> = async (_, ctx) => {
  const data = await resolvePost(ctx.params);
  if (!data) {
    return ctx.renderNotFound();
  }
  return ctx.render(data);
};

const Md = createMdRenderer({
  BlockComponent: Block,
  BlockComponentWithData: BlockWithData,
  InlineComponent: ({ children }) => (
    <span style={{ background: "blue", color: "white" }}>{children}</span>
  ),
});

export default function PostSingle({ data }: PageProps<Props>) {
  const { post, wfData } = data;

  return (
    <Fragment>
      <h1>{post.title}</h1>
      <h2>{post.date_published}</h2>
      <Md node={post.content!} wfData={wfData} />
    </Fragment>
  );
}
