import { assertEquals } from "assert/assert_equals.ts";
import { path } from "../../../deps.ts";
import { parseMd } from "../parseMd.ts";
import { getPostMetadata, getWfRequests } from "../metadata.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const text = await Deno.readTextFile(path.join(__dirname, "testpost.md"));

Deno.test("parser does not throw on valid markdown", () => {
  const result = parseMd(text);
  assertEquals(result.type, "root");
});

Deno.test("gets the metadata", () => {
  const mdast = parseMd(text);
  const metadata = getPostMetadata(mdast);
  assertEquals(metadata.title, "My awesome blog post");
});

Deno.test("gets wf metadata", () => {
  const mdast = parseMd(text);
  const wf = getWfRequests(mdast);
  assertEquals(wf, ["wf://demographics/shire?city=hobbiton"]);
});
