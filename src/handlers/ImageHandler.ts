import { path, z } from "../deps.ts";
import type { Handler } from "$fresh/server.ts";
import { WfError } from "../db/index.ts";
import { parseQuery } from "../parsers/index.ts";
import { resolveItem } from "../db/WfGet.ts";
import { TyImageSchema } from "../builtins/Image/index.ts";
import { config } from "../plugin/config.ts";

export const ImageHandler = (
  slugParam = "slug",
  widthQueryParam = "width",
): Handler => {
  const parser = parseQuery(z.object({
    [widthQueryParam]: z.union([
      z.coerce.number(),
      z.enum(["smallest", "largest"]),
    ]).optional(),
  }));

  return async (req, ctx) => {
    const url = new URL(req.url);
    const slug: string = ctx.params[slugParam];
    const match = z.string().safeParse(slug);
    if (!match.success) {
      return new WfError(400, "Item ID must be supplied to Image route")
        .toHttp();
    }

    let width: number | null;
    try {
      const parsedQuery = parser(url.search);
      const queryWidth = parsedQuery[widthQueryParam];
      width = typeof queryWidth === "number"
        ? queryWidth
        : queryWidth === "smallest"
        ? 0
        : null;
    } catch (_err) {
      return new WfError(
        400,
        "Invalid query width param supplied to Image route",
      )
        .toHttp();
    }

    let imageData: TyImageSchema;
    try {
      const get = await resolveItem<TyImageSchema>({
        modelName: "image",
        slug,
      });
      if (!get.data) {
        throw new WfError(404);
      }
      imageData = get.data;
    } catch (err: WfError | Error | unknown) {
      if ((err as WfError).isWfError) {
        return (err as WfError).toHttp();
      }
      throw err;
    }

    const sizes = imageData.sizes.slice().sort((a, b) => a - b);
    const size = sizes.find((size) => width !== null && size >= width) ||
      sizes[sizes.length - 1];
    const filename = `${slug}_${size}.${imageData.format}`;
    const filepath = path.join(Deno.cwd(), config.Image.outDir, filename);
    const file = await Deno.open(filepath, { read: true });
    return new Response(file.readable);
  };
};
