import { assertEquals } from "assert/assert_equals.ts";
import { assertThrows } from "assert/assert_throws.ts";
import { z } from "../../deps.ts";
import { parseQuery } from "../parseQuery.ts";

const parser = parseQuery(z.object({
  isPublished: z.coerce.boolean(),
  daysOfWeek: z.array(z.string()).default([]),
  frequency: z.coerce.number().optional(),
}));

Deno.test("with boolean", () => {
  const result = parser("?isPublished=true&daysOfWeek=Sunday,Monday");
  assertEquals(result, {
    isPublished: true,
    daysOfWeek: ["Sunday", "Monday"],
  });
});

Deno.test("with empty array", () => {
  const result = parser("?isPublished=true");
  assertEquals(result, {
    isPublished: true,
    daysOfWeek: [],
  });
});

Deno.test("with false boolean", () => {
  const result = parser("?daysOfWeek=Sunday,Monday");
  assertEquals(result, {
    isPublished: false,
    daysOfWeek: ["Sunday", "Monday"],
  });
});

Deno.test("uncoercable value", () => {
  assertThrows(() => parser("?frequency=fourforty"));
});
