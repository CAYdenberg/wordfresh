import { z } from "zod";
import { parse } from "../deps.ts";

export const parseQuery = <Q>(schema: z.Schema<Q>) => (query: string) => {
  const params = parse(query, { arrayFormat: "comma" });
  const result = schema.parse(params);
  return result;
};
