import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import wordfresh from "src";
import { Speaking } from "./models/Speaking.ts";

export default defineConfig({
  plugins: [tailwind(), wordfresh({ models: [Speaking] })],
});
