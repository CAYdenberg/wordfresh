import { PageProps } from "$fresh/server.ts";
import { Fragment } from "preact/jsx-runtime";
import { CreateMd, PostHandler, type PostHandlerProps, WfHead } from "src";
import { Icon } from "../../client/Icon.tsx";
import { Banana } from "https://esm.sh/lucide-preact@0.299.0/?exports=Banana";

import Block from "../../islands/Block.tsx";
import BlockWithData from "../../islands/BlockWithData.tsx";

type Props = PostHandlerProps;

export const handler = PostHandler();

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
