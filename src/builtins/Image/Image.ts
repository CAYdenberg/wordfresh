import { IM, path, z } from "../../deps.ts";

import { config } from "../../plugin/config.ts";
import { slugify } from "../../parsers/index.ts";
import type { Model } from "../../db/index.ts";
import { Attachment } from "../../db/Model.ts";
import { getChecksum } from "../../db/checksum.ts";

type IMagickImage = IM.IMagickImage;
const ImageMagick = IM.ImageMagick;

export const ImageSchema = z.object({
  filename: z.string(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number(),
  format: z.enum(["jpg", "png", "bmp", "webp", "unknown"]),
  checksum: z.string(),
  sizes: z.array(z.object({
    size: z.number(),
    attachment: Attachment(),
  })),
});

export type TyImageSchema = z.infer<typeof ImageSchema>;

export type TyImageMetadata = Omit<
  z.infer<typeof ImageSchema>,
  "filename" | "sizes" | "checksum"
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

const generateImageSizes = (
  data: Uint8Array,
  sizes: number[],
  emitSize: (size: number, data: Uint8Array) => void,
): Promise<{ metadata: TyImageMetadata; sizes: number[] }> => {
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
        outsizes = [...outsizes, size];
        img.write(img.format, (data) => {
          emitSize(size, data);
        });
      });

      resolve({ metadata, sizes: outsizes });
    });
  });
};

export const Image: Model<z.infer<typeof ImageSchema>> = {
  modelName: "image",

  schema: ImageSchema,

  build: async ({ create, createAttachment, getExisting }) => {
    await IM.initialize();

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
      const checksum = await getChecksum(binary);
      const existing = await getExisting(slug);
      if (existing && existing.checksum === checksum) {
        continue;
      }

      const getFilename = (size: number) => `${filename}_${size}${extname}`;
      const { metadata, sizes } = await generateImageSizes(
        binary,
        config.Image.sizes,
        (size, data) => {
          console.log(`Creating ${getFilename(size)}`);
          createAttachment(
            getFilename(size),
            data,
          );
        },
      );

      create(slug, {
        ...metadata,
        checksum,
        sizes: sizes.map((size) => ({
          size,
          attachment: {
            isWfAttachment: true,
            filename: getFilename(size),
          },
        })),
        filename,
      });
    }

    return true;
  },
};
