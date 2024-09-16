import { z } from "zod";
import { parse, ParsedQuery, stringify } from "../deps.ts";

export const parseQuery = <Q>(schema: z.Schema<Q>) => (query: string) => {
  const params = parse(query, { arrayFormat: "comma" });
  const result = schema.parse(params);
  return result;
};

export const stringifyQuery = <Q>(query: ParsedQuery<Q>) => {
  return stringify(query, { arrayFormat: "comma" });
};
