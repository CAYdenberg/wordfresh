import { assertEquals } from "assert/assert_equals.ts";

import { Model } from "../Model.ts";

import { startDb } from "../bindings/denoKv.ts";
import { z } from "../../deps.ts";
import { setConfig } from "../../plugin/config.ts";
import { resolveItem, resolveQuery } from "../WfGet.ts";

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
