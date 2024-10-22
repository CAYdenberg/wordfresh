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
  sizes: z.array(z.number()),
});

export type TyImageSchema = z.infer<typeof ImageSchema>;

export type TyImageMetadata = Omit<
  z.infer<typeof ImageSchema>,
  "filename" | "sizes"
>;

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

const createOut = async () => {
  const { outDir } = config.Image;
  await Deno.mkdir(path.join(Deno.cwd(), outDir), { recursive: true });
  return true;
};

const generateImageSizes = (
  data: Uint8Array,
  sizes: number[],
  emitSize: (size: number, data: Uint8Array) => void,
): Promise<{
  metadata: TyImageMetadata;
  outsizes: number[];
}> => {
  return new Promise((resolve) => {
    ImageMagick.read(data, (img: IMagickImage) => {
      const format = getFormat(img.format);
      const aspectRatio = img.width / img.height;
      const metadata: TyImageMetadata = {
        width: img.width,
        height: img.height,
        format,
        aspectRatio,
      };
      let outsizes: number[] = [];

      [img.width, ...sizes].sort((a, b) => b - a).forEach((size) => {
        if (size > img.width) return;
        img.resize(size, size / aspectRatio);
        outsizes = [...sizes, size];
        img.write(img.format, (data) => {
          emitSize(size, data);
        });
      });

      resolve({ metadata, outsizes });
    });
  });
};

export const Image: Model<z.infer<typeof ImageSchema>> = {
  modelName: "image",

  schema: ImageSchema,

  purgeBeforeBuild: false,

  build: async ({ create, alreadyExists }) => {
    await IM.initialize();
    await createOut();

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
      if (await alreadyExists(slug)) {
        continue;
      }

      const binary = await Deno.readFile(filePath);
      const { metadata, outsizes } = await generateImageSizes(
        binary,
        config.Image.sizes,
        (size, data) => {
          const destName = `${filename}_${size}${extname}`;
          // TODO: Check Fresh config for change to static directory?
          const destPath = path.join(Deno.cwd(), "static", "_img", destName);
          Deno.writeFile(destPath, data);
        },
      );

      create(slug, {
        ...metadata,
        sizes: outsizes,
        filename,
      });
    }

    return true;
  },
};
