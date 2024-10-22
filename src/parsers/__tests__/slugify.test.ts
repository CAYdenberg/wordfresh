import { assertEquals } from "assert/assert_equals.ts";
import { slugFromFilename, slugify } from "../slugify.ts";

Deno.test("slugify", () => {
  assertEquals(slugify("my_awesome post"), "my-awesome-post");
});

Deno.test("slugFromFilename", () => {
  assertEquals(slugFromFilename("My Awesome Post.md"), "my-awesome-post");
});
