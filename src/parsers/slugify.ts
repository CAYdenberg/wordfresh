import { path } from "../deps.ts";
import { slugify as _slugify } from "https://deno.land/x/slugify@0.3.0/mod.ts";

export const slugify = (input: string) =>
  _slugify(input, {
    replacement: "-",
    remove: /[:\,\/\\\'\"\(\)]/,
    lower: true,
  });

export const slugFromFilename = (filePath: string) => {
  const basename = path.basename(filePath);
  const extname = path.extname(filePath);
  const filename = basename.slice(0, basename.length - extname.length);
  return slugify(filename);
};
