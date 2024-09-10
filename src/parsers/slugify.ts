import { slugify as _slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";

export const slugify = (input: string) =>
  _slugify(input, {
    replacement: "-",
    remove: /[:\,\/\\\'\"\(\)]/,
    lower: true,
  });
