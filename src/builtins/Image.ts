import { IM } from "../deps.ts";

import { path, z } from "../deps.ts";
import { config } from "../plugin/config.ts";
import { slugify } from "../parsers/index.ts";
import type { Model } from "../db/index.ts";

type IMagickImage = IM.IMagickImage;
const ImageMagick = IM.ImageMagick;

export const ImageSchema = z.object({
  filename: z.string(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number(),
  format: z.enum(["jpg", "png", "bmp", "webp", "unknown"]),
  sizes: z.array(z.object({
    size: z.number(),
    filename: z.string(),
    success: z.boolean(),
  })),
});

export type TImageSchema = z.infer<typeof ImageSchema>;

const getFormat = (magicFormat: IM.MagickFormat) => {
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

const generateImageSizes = (
  data: Uint8Array,
  sizes: number[],
  emitMetadata: (
    metadata: Omit<z.infer<typeof ImageSchema>, "filename" | "sizes">,
  ) => void,
  emitSize: (size: number, data: Uint8Array) => void,
) => {
  IM.initialize().then(() => {
    ImageMagick.read(data, (img: IMagickImage) => {
      const format = getFormat(img.format);
      const aspectRatio = img.width / img.height;
      emitMetadata({
        width: img.width,
        height: img.height,
        format,
        aspectRatio,
      });

      sizes.slice().sort((a, b) => b - a).forEach((size) => {
        if (size > img.width) return;
        img.resize(size, size / aspectRatio);
        img.write(img.format, (data) => {
          emitSize(size, data);
        });
      });
    });
  });
};

export const Image: Model<z.infer<typeof ImageSchema>> = {
  modelName: "image",

  schema: ImageSchema,

  build: async ({ create }) => {
    const dirPath = path.join(Deno.cwd(), config.Image.dir);
    const dir = Deno.readDir(dirPath);

    for await (const dirEntry of dir) {
      if (!dirEntry.isFile) {
        continue;
      }
      const filePath = path.join(dirPath, dirEntry.name);
      const extname = path.extname(filePath);
      const filename = path.basename(filePath, extname);
      const slug = slugify(filename);
      const binary = await Deno.readFile(filePath);
      generateImageSizes(binary, config.Image.sizes, (metadata) => {
        create(slug, {
          ...metadata,
          filename,
          sizes: [],
        });
      }, (size, data) => {
        const destName = `${filename}_${size}${extname}`;
        // TODO: Check Fresh config for change to static directory?
        const destPath = path.join(Deno.cwd(), "static", destName);
        Deno.writeFile(destPath, data);
      });
    }

    return true;
  },
};

/**
 * TODO: We should probably resize the image to the nearest 100 px to avoid
 * creating excessive/unnecessary duplicates
 */
// export const imageHandler = async (
//   req: Request,
//   ctx: FreshContext
// ): Promise<Response> => {
//   const slug = ctx.params.slug;
//   const query = new URL(req.url).search;

//   const params = parseQuery(
//     z.object({
//       width: z
//         .union([z.coerce.number(), z.enum(["thumbnail", "og"])])
//         .optional(),
//       regen: z.coerce.boolean().optional(),
//     })
//   )(query);

//   const desiredWidth = getDesiredWidth(params.width);

//   if (desiredWidth) {
//     const existing = await getFile(Image)(`${slug}:w${desiredWidth}`);

//     if (params.regen || existing.status === 404) {
//       const original = await getFile(Image)(ctx.params.slug);

//       if (original.status < 400) {
//         const blob = await original.blob();
//         const arrayBuffer = await blob.arrayBuffer();
//         const binary = new Uint8Array(arrayBuffer);
//         const resizedImage = await resizeImage(binary, desiredWidth);

//         const mime = `image/${resizedImage.metadata.format}`;

//         try {
//           await createFile(Image)(
//             {
//               ...resizedImage.metadata,
//               filename: slug,
//             },
//             mime,
//             resizedImage.data
//           );
//         } catch (_e: unknown) {
//           await forceCreateFile(Image)(
//             {
//               ...resizedImage.metadata,
//               filename: slug,
//             },
//             mime,
//             resizedImage.data
//           );
//         }

//         return new Response(resizedImage.data, {
//           status: 200,
//           headers: {
//             "Content-Type": mime,
//           },
//         });
//       }
//     }

//     return existing;
//   }

//   return getFile(Image)(ctx.params.slug);
// };

// export const renderImage = async (
//   filename: string,
//   render: () => Promise<Uint8Array>
// ): Promise<Response> => {
//   const fileFromDb = await getFile(Image)(filename);
//   if (fileFromDb.status < 400) {
//     return fileFromDb;
//   }

//   try {
//     const binary = await render();
//     const metadata = await getImageMetadata(binary);

//     const mime = `image/${metadata.format}`;

//     createFile(Image)(
//       {
//         ...metadata,
//         filename,
//       },
//       mime,
//       binary
//     );

//     return new Response(binary, {
//       status: 200,
//       headers: {
//         "Content-Type": mime,
//       },
//     });
//   } catch (_err: unknown) {
//     return new Response(JSON.stringify({ ok: false }), {
//       status: 400,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   }
// };
