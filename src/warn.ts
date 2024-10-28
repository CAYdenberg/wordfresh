import { config } from "./plugin/config.ts";

export const warn = (message: string) => {
  if (config.developerWarnings) {
    console.warn(`WordFresh: ${message}`);
  }
};
