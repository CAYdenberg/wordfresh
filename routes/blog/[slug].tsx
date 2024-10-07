import { Handler, PageProps } from "$fresh/server.ts";
import { Fragment } from "preact/jsx-runtime";
import { createMdRenderer, resolveGet, TyPostSchema } from "src";

import Block from "../../islands/Block.tsx";
import BlockWithChildren from "../../islands/BlockWithChildren.tsx";

interface Data {
  post: TyPostSchema | null;
}

export const handler: Handler<Data> = async (req, ctx) => {
  const slug = ctx.params.slug;
  const resolved = await resolveGet({
    modelName: "post",
    slug,
  });

  return ctx.render({
    post: resolved.data || null,
  } as Data);
};

const Md = createMdRenderer({
  BlockComponent: Block,
  BlockWithChildren,
});

export default function PostSingle({ data }: PageProps<Data>) {
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
