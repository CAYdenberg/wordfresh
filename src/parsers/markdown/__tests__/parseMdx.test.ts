import { assertEquals } from "assert/assert_equals.ts";
import { path } from "../../../deps.ts";
import { parseMdx } from "../parseMdx.ts";
import { getPostMetadata } from "../metadata.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const text = await Deno.readTextFile(path.join(__dirname, "testpost.mdx"));

Deno.test("parser does not throw on valid markdown", () => {
  const result = parseMdx(text);
  assertEquals(result.type, "root");
});

Deno.test("gets the metadata", () => {
  const mdast = parseMdx(text);
  const metadata = getPostMetadata(mdast);
  assertEquals(metadata.title, "My awesome blog post");
});
