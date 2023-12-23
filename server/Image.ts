import {
  ImageMagick,
  IMagickImage,
  initialize,
  MagickFormat,
} from "imagemagick";

import { HandlerContext } from "$fresh/server.ts";
import { z } from "zod";

import { OG_WIDTH, THUMBNAIL_WIDTH } from "./mod.ts";
import { Model } from "./Model.ts";
import { createFile, forceCreateFile, getFile } from "./db.ts";
import { parseQuery } from "./Isoquery.ts";

await initialize();

export const ImageSchema = z.object({
  filename: z.string(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number(),
  resized: z.number().optional(),
  format: z.enum(["jpg", "png", "bmp", "webp", "unknown"]),
});

export type TImageSchema = z.infer<typeof ImageSchema>;

const getFormat = (magicFormat: MagickFormat) => {
  switch (magicFormat) {
    case "PNG":
      return "png";
    case "JPG":
    case "JPEG":
      return "jpg";
    case "BMP":
      return "bmp";
    case "WEBP":
      return "webp";
  }
  return "unknown";
};

const getImageMetadata = (
  data: Uint8Array
): Promise<Omit<z.infer<typeof ImageSchema>, "filename" | "resized">> => {
  return new Promise((resolve) => {
    ImageMagick.read(data, (img: IMagickImage) => {
      const format = getFormat(img.format);
      const aspectRatio = img.width / img.height;
      resolve({
        width: img.width,
        height: img.height,
        format,
        aspectRatio,
      });
    });
  });
};

const resizeImage = (
  data: Uint8Array,
  desiredWidth: number
): Promise<{
  data: Uint8Array;
  metadata: Omit<z.infer<typeof ImageSchema>, "filename">;
}> => {
  return new Promise((resolve) => {
    ImageMagick.read(data, (img: IMagickImage) => {
      const format = getFormat(img.format);
      const aspectRatio = img.width / img.height;

      img.resize(desiredWidth, desiredWidth / aspectRatio);

      img.write(img.format, (data) => {
        resolve({
          data,
          metadata: {
            format,
            aspectRatio,
            width: img.width,
            height: img.height,
            resized: desiredWidth,
          },
        });
      });
    });
  });
};

export const Image: Model<z.infer<typeof ImageSchema>> = {
  modelName: "image",

  schema: ImageSchema,

  getId: (thing) =>
    thing.resized ? `${thing.filename}:w${thing.resized}` : thing.filename,

  index: ["filename"],

  ingest: async ({ filename, binary, createFile }) => {
    const metadata = await getImageMetadata(binary);
    createFile(
      {
        ...metadata,
        filename: `${filename}`,
      },
      `image/${metadata.format}`,
      binary,
      { overwrite: true }
    );

    const resized = await resizeImage(binary, THUMBNAIL_WIDTH);
    createFile(
      {
        ...resized.metadata,
        filename: `${filename}`,
      },
      `image/${resized.metadata.format}`,
      resized.data,
      { overwrite: true }
    );
  },
};

export const getDesiredWidth = (
  width?: number | "thumbnail" | "og"
): number | null => {
  if (!width) return null;

  switch (width) {
    case "og":
      return OG_WIDTH;

    case "thumbnail":
      return THUMBNAIL_WIDTH;
  }

  if (width < 0) return null;

  return Math.ceil(width / 100) * 100;
};

/**
 * TODO: We should probably resize the image to the nearest 100 px to avoid
 * creating excessive/unnecessary duplicates
 */
export const imageHandler = async (
  req: Request,
  ctx: HandlerContext
): Promise<Response> => {
  const slug = ctx.params.slug;
  const query = new URL(req.url).search;

  const params = parseQuery(
    z.object({
      width: z
        .union([z.coerce.number(), z.enum(["thumbnail", "og"])])
        .optional(),
      regen: z.coerce.boolean().optional(),
    })
  )(query);

  const desiredWidth = getDesiredWidth(params.width);

  if (desiredWidth) {
    const existing = await getFile(Image)(`${slug}:w${desiredWidth}`);

    if (params.regen || existing.status === 404) {
      const original = await getFile(Image)(ctx.params.slug);

      if (original.status < 400) {
        const blob = await original.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const binary = new Uint8Array(arrayBuffer);
        const resizedImage = await resizeImage(binary, desiredWidth);

        const mime = `image/${resizedImage.metadata.format}`;

        try {
          await createFile(Image)(
            {
              ...resizedImage.metadata,
              filename: slug,
            },
            mime,
            resizedImage.data
          );
        } catch (_e: unknown) {
          await forceCreateFile(Image)(
            {
              ...resizedImage.metadata,
              filename: slug,
            },
            mime,
            resizedImage.data
          );
        }

        return new Response(resizedImage.data, {
          status: 200,
          headers: {
            "Content-Type": mime,
          },
        });
      }
    }

    return existing;
  }

  const res = await getFile(Image)(ctx.params.slug);
  return res;
};
