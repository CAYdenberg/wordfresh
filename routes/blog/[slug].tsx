import { FreshContext, Handler } from "$fresh/server.ts";
import { parseMdx } from "../../src/parsers/markdown/parseMdx.ts";

export const handler: Handler = async (req, ctx) => {
  const text = await Deno.readTextFile(
    "content/posts/simpsons-imdb-ratings-by-season.mdx"
  );

  const mdast = parseMdx(text);

  return new Response(JSON.stringify(mdast), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
