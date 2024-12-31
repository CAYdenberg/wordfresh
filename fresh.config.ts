import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import wordfresh from "src";
import { Speaking } from "./models/Speaking.ts";

export default defineConfig({
  plugins: [
    tailwind(),
    wordfresh((config) => ({
      ...config,
      models: [...config.models, Speaking],
      siteTitle: "WordFresh",
      siteDescription: "Just another Deno blogging solution",
      siteUrl: Deno.env.get("SITE_URL") || "http://localhost:8000",
      siteMainAuthor: {
        name: "Casey Ydenberg",
        email: "casey@livingpixel.io",
      },
      purge: true,
    })),
  ],
});
