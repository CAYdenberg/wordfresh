import { assertEquals } from "assert/assert_equals.ts";
import { paginate } from "../pagination.ts";

const paginator = paginate(10, 79);

Deno.test("pagination: known total", () => {
  const result = paginator("http://example.com/blog/?page=3");

  assertEquals(result.params.limit, 10);
  assertEquals(result.params.skip, 20);
  assertEquals(result.url.first, "http://example.com/blog/?page=1");
  assertEquals(result.url.prev, "http://example.com/blog/?page=2");
  assertEquals(result.url.next, "http://example.com/blog/?page=4");
  assertEquals(result.url.last, "http://example.com/blog/?page=8");
  assertEquals(result.summary.from, 21);
  assertEquals(result.summary.to, 30);
  assertEquals(result.summary.of, 79);
});

Deno.test("pagination: on the first page", () => {
  const result = paginator("http://example.com/blog/");

  assertEquals(result.params.limit, 10);
  assertEquals(result.params.skip, 0);
  assertEquals(result.url.first, null);
  assertEquals(result.url.prev, null);
  assertEquals(result.url.next, "http://example.com/blog/?page=2");
  assertEquals(result.url.last, "http://example.com/blog/?page=8");
  assertEquals(result.summary.from, 1);
  assertEquals(result.summary.to, 10);
  assertEquals(result.summary.of, 79);
});

Deno.test("pagination: on the last page", () => {
  const result = paginator("http://example.com/blog/?page=8");

  assertEquals(result.params.limit, 10);
  assertEquals(result.params.skip, 70);
  assertEquals(result.url.first, "http://example.com/blog/?page=1");
  assertEquals(result.url.prev, "http://example.com/blog/?page=7");
  assertEquals(result.url.next, null);
  assertEquals(result.url.last, null);
  assertEquals(result.summary.from, 71);
  assertEquals(result.summary.to, 79);
  assertEquals(result.summary.of, 79);
});

Deno.test("pagination: unknown total", () => {
  const result = paginate(10)("http://example.com/blog/?page=3");

  assertEquals(result.params.limit, 10);
  assertEquals(result.params.skip, 20);
  assertEquals(result.url.first, "http://example.com/blog/?page=1");
  assertEquals(result.url.prev, "http://example.com/blog/?page=2");
  assertEquals(result.url.next, "http://example.com/blog/?page=4");
  assertEquals(result.url.last, null);
  assertEquals(result.summary.from, 21);
  assertEquals(result.summary.to, 30);
  assertEquals(result.summary.of, null);
});
