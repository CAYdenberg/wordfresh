// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_speaking_slug_ from "./routes/api/speaking/[slug].ts";
import * as $api_speaking_index from "./routes/api/speaking/index.ts";
import * as $blog_slug_ from "./routes/blog/[slug].tsx";
import * as $blog_index from "./routes/blog/index.tsx";
import * as $greet_name_ from "./routes/greet/[name].tsx";
import * as $index from "./routes/index.tsx";
import * as $Block from "./islands/Block.tsx";
import * as $BlockWithData from "./islands/BlockWithData.tsx";
import * as $Counter from "./islands/Counter.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/speaking/[slug].ts": $api_speaking_slug_,
    "./routes/api/speaking/index.ts": $api_speaking_index,
    "./routes/blog/[slug].tsx": $blog_slug_,
    "./routes/blog/index.tsx": $blog_index,
    "./routes/greet/[name].tsx": $greet_name_,
    "./routes/index.tsx": $index,
  },
  islands: {
    "./islands/Block.tsx": $Block,
    "./islands/BlockWithData.tsx": $BlockWithData,
    "./islands/Counter.tsx": $Counter,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
