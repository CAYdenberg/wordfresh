import { z } from "zod";
import { parseQuery } from "../Isoquery.ts";
import { assertEquals } from "assert/assert_equals.ts";
import { assertThrows } from "assert/assert_throws.ts";

const schema = z.object({
  orderBy: z.coerce.string(),
  order: z.enum(["asc", "desc"]),
  page: z.coerce.number().optional(),
});

Deno.test("parseQuery: simple string", () => {
  const result = parseQuery(schema)("orderBy=date&order=desc&page=2");
  assertEquals(result, {
    orderBy: "date",
    order: "desc",
    page: 2,
  });
});

Deno.test("parseQuery: throws if not schema", () => {
  assertThrows(() => parseQuery(schema)("orderBy=date&order=foo"));
});

const arraySchema = z.object({
  tags: z.array(z.string()),
});

Deno.test("parseQuery: arrays", () => {
  const result = parseQuery(arraySchema)("tags=recipes,yolo");
  assertEquals(result, { tags: ["recipes", "yolo"] });
});
