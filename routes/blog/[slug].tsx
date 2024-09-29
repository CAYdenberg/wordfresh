import { Handler, PageProps } from "$fresh/server.ts";
import { z } from "zod";
import { Fragment } from "preact/jsx-runtime";
import { getItem, Post } from "src";
import { createMd } from "../../src/components/createMd.tsx";

import Block from "../../islands/Block.tsx";
import BlockWithChildren from "../../islands/BlockWithChildren.tsx";

interface Data {
  post: z.infer<typeof Post["schema"]> | null;
}

export const handler: Handler<Data> = async (req, ctx) => {
  const slug = ctx.params.slug;
  const post = await getItem(Post)(slug);

  return ctx.render({
    post,
  });
};

const Md = createMd({
  BlockComponent: Block,
  BlockWithChildren,
});

export default function PostSingle({ data, url }: PageProps<Data>) {
  if (!data.post?.content) {
    return <h1>Post not found</h1>;
  }

  return (
    <Fragment>
      <h1>{data.post.title}</h1>
      <h2>{data.post.date_published}</h2>
      <Md node={data.post.content} />
    </Fragment>
  );
}
