import { assertEquals } from "assert/assert_equals.ts";
import { getDesiredWidth } from "../Image.ts";

Deno.test("getDesiredWidth: keyword", () => {
  assertEquals(getDesiredWidth("thumbnail"), 300);
});

Deno.test("getDesiredWidth: value -> rounds to nearest hundred", () => {
  assertEquals(getDesiredWidth(499), 500);
});

Deno.test("getDesiredWidth: undefined -> return null", () => {
  assertEquals(getDesiredWidth(undefined), null);
});

Deno.test("getDesiredWidth: negative value -> return null", () => {
  assertEquals(getDesiredWidth(-499), null);
});
