import { Handler, PageProps } from "$fresh/server.ts";
import { Fragment } from "preact/jsx-runtime";
import { CreateMd, ResolvedPost, resolvePost, WfHead } from "src";
import { Icon } from "src/client/Icon.tsx";
import { Banana } from "https://esm.sh/lucide-preact@0.461.0/?exports=Banana";

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

const Md = CreateMd({
  BlockComponent: Block,
  BlockComponentWithData: BlockWithData,
  InlineComponent: ({ children }) => (
    <span style={{ background: "blue", color: "white" }}>{children}</span>
  ),
});

export default function PostSingle({ data, url }: PageProps<Props>) {
  const { post, wfData } = data;

  return (
    <Fragment>
      <WfHead url={url} pageTitle={post.title} pageDescription={post.summary} />

      <article class="container mx-auto">
        <h1>{post.title}</h1>
        <h2>{post.date_published}</h2>
        <Md node={post.content!} wfData={wfData} />
      </article>
      <p>
        This is the default way of{" "}
        <Icon className="text-[blue] text-[4rem]" icon={Banana} />
        aligning icons.
      </p>
    </Fragment>
  );
}
