import { path } from "../deps.ts";
import { slugify as _slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";

export const slugify = (input: string) =>
  _slugify(input, {
    replacement: "-",
    remove: /[:\,\/\\\'\"\(\)]/,
    lower: true,
  });

export const slugFromFilename = (filePath: string) => {
  const filename = path.basename(filePath, path.extname(filePath));
  return slugify(filename);
};
