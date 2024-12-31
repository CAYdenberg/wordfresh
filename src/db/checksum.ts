import { crypto, encodeHex } from "../deps.ts";

export const getChecksum = async (data: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(digest);
};
