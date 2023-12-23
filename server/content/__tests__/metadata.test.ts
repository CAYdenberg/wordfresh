import { assertEquals } from "assert/assert_equals.ts";
import { flattenTree, getPostMetadata, MdastNode } from "../index.ts";

import post from "./__data__/post.json" assert { type: "json" };

Deno.test("flattenTree", () => {
  const tree = post as MdastNode;
  const flat = flattenTree(tree);
  const yaml = flat.filter((node) => node.type === "yaml");
  assertEquals(yaml.length, 1);
});

Deno.test("get post metadata", () => {
  const yaml =
    'title: "Scrollable COVID tracker"\nimg: "../resources/covid-tracker.png"\nsummary: "Scroll or swipe over the history of the pandemic in your country"\nrank: 0\ndate: "2023-06-06"';
  const metadata = getPostMetadata({
    type: "root",
    children: [{ type: "yaml", value: yaml }],
  });
  assertEquals(metadata.date_published, "2023-06-06T00:00:00.000Z");
});
