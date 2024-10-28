import { assertEquals } from "assert/assert_equals.ts";
import { assert } from "assert/assert.ts";

import { Model } from "../Model.ts";

import { startDb } from "../bindings/denoKv.ts";
import { z } from "../../deps.ts";
import { setConfig } from "../../plugin/config.ts";
import { parseWf, resolveItem, resolveQuery, resolveWf } from "../WfGet.ts";
import type {
  WfGetItemResolved,
  WfGetQuery,
  WfGetQueryResolved,
} from "../WfGet.ts";

startDb(await Deno.openKv(":memory:"));

/*
 ** Test with a simple model
 */

const ContactSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
});

type TyContactSchema = z.infer<typeof ContactSchema>;

const Contact: Model<TyContactSchema> = {
  modelName: "contacts",

  schema: ContactSchema,

  purgeBeforeBuild: true,

  build: ({ create }) => {
    create("hobbit-1", {
      name: "Frodo Baggins",
      email: "frodo@shire.uk",
      phone: "555-555-5555",
    });
    create("hobbit-2", {
      name: "Samwise Gamgee",
      email: "sam@shire.uk",
    });
    return Promise.resolve(true);
  },
};

/**
 * With Query Schema
 */

const QuerySchema = z.object({
  excludeNoPhone: z.coerce.boolean().optional(),
}).strict();

type TyQuerySchema = z.infer<typeof QuerySchema>;

const QueryableContact: Model<TyContactSchema, TyQuerySchema> = {
  ...Contact,

  modelName: "queryable-contacts",

  querySchema: QuerySchema,

  runQuery: (contacts) => (query) => {
    if (!query.excludeNoPhone) return contacts;

    return contacts.filter((f) => !!f.phone);
  },
};

const ContactWithInvalidBuild: Model<TyContactSchema> = {
  ...Contact,

  modelName: "failing-build",

  build: ({ create }) => {
    create("hobbit-1", {
      name: "Peregrin Took",
    } as TyContactSchema);
    return Promise.resolve(true);
  },
};

setConfig({
  developerWarnings: false,
  models: [Contact, QueryableContact, ContactWithInvalidBuild],
});

const assertRejectsAsWfError = (
  fn: () => Promise<unknown>,
  status?: number,
) => {
  return fn().then(() => {
    throw new Error(`Expected fn to throw`);
  }).catch((err) => {
    assertEquals(err.isWfError, true, "Not a WfError");
    status && assertEquals(err.status, status, "Error is wrong status");
  });
};

const assertRejectsAsNotWfError = (
  fn: () => Promise<unknown>,
) => {
  return fn().then(() => {
    const err = new Error();
    // deno-lint-ignore no-explicit-any
    (err as any).isErrorInTest = true;
    throw err;
  }).catch((err) => {
    assertEquals(!!err.isErrorInTest, false, "Expected fn to throw");
    assertEquals(!!err.isWfError, false, "WfError not expected");
  });
};

Deno.test("resolveItem", async () => {
  const result = await resolveItem<TyContactSchema>({
    modelName: "contacts",
    slug: "hobbit-1",
  });
  assertEquals(result.data?.name, "Frodo Baggins");
});

Deno.test("resolveItem that does not exist", async () => {
  await assertRejectsAsWfError(() =>
    resolveItem<TyContactSchema>({
      modelName: "contacts",
      slug: "elf-1",
    }), 404);
});

Deno.test("resolveQuery", async () => {
  const result = await resolveQuery<TyContactSchema>({
    modelName: "contacts",
  });
  assertEquals(result.data?.length, 2);
});

Deno.test("resolveQuery on queryable model", async () => {
  const result = await resolveQuery<TyContactSchema>({
    modelName: "queryable-contacts",
    query: "",
  });
  assertEquals(result.data?.length, 2);
});

Deno.test("resolveQuery on queryable Model with no query", async () => {
  await assertRejectsAsWfError(() =>
    resolveQuery<TyContactSchema>({
      modelName: "queryable-contacts",
    }), 400);
});

Deno.test("resolveQuery on queryable Model with invalid query", async () => {
  await assertRejectsAsWfError(() =>
    resolveQuery<TyContactSchema>({
      modelName: "queryable-contacts",
      query: "foo=bar",
    }), 400);
});

Deno.test("resolveQuery on queryable Model with ?", async () => {
  const result = await resolveQuery<TyContactSchema>({
    modelName: "queryable-contacts",
    query: "?excludeNoPhone=true",
  });
  assertEquals(result.data?.length, 1);
});

Deno.test("resolveQuery on queryable Model with NO ?", async () => {
  const result = await resolveQuery<TyContactSchema>({
    modelName: "queryable-contacts",
    query: "excludeNoPhone=true",
  });
  assertEquals(result.data?.length, 1);
});

Deno.test("Attempt to access failing build results in an error", async () => {
  await assertRejectsAsNotWfError(() =>
    resolveItem({
      modelName: "failing-build",
      slug: "hobbit-1",
    })
  );
});

Deno.test("parseWf: Parse to WfGetItem", () => {
  const result = parseWf("wf://contacts/hobbit-1");
  assertEquals(result, {
    modelName: "contacts",
    slug: "hobbit-1",
  });
});

Deno.test("parseWf: Parse to WfGetQuery", () => {
  const result = parseWf(
    "wf://queryable-contacts/?excludeNoPhone=true",
  ) as WfGetQuery;
  assertEquals(result?.modelName, "queryable-contacts");
  assert(result?.query?.endsWith("excludeNoPhone=true"));
});

Deno.test("parseWf: Parse to WfGetQuery no trailing slash", () => {
  const result = parseWf(
    "wf://queryable-contacts?excludeNoPhone=true",
  ) as WfGetQuery;
  assertEquals(result?.modelName, "queryable-contacts");
  assert(result?.query?.endsWith("excludeNoPhone=true"));
});

Deno.test("parseWf: Parse to WfGetQuery modelName only", () => {
  const result = parseWf("wf://queryable-contacts") as WfGetQuery;
  assertEquals(result?.modelName, "queryable-contacts");
  assertEquals(!!result?.query, false);
});

Deno.test("parseWf: Ignore non-wf URIs", () => {
  const result = parseWf("https://example.com");
  assertEquals(result, null);
});

Deno.test("resolveWf: Resolve item from string", async () => {
  const reqStr = "wf://contacts/hobbit-1";
  const result = await resolveWf(reqStr);
  const item = result[reqStr] as WfGetItemResolved<
    TyContactSchema
  >;
  assertEquals(item.data?.name, "Frodo Baggins");
});

Deno.test("resolveWf: Resolve query from string", async () => {
  const reqStr = "wf://queryable-contacts/?excludeNoPhone=true";
  const result = await resolveWf(reqStr);
  const item = result[
    reqStr
  ] as WfGetQueryResolved<
    TyContactSchema
  >;
  assertEquals(item.data?.length, 1);
});
