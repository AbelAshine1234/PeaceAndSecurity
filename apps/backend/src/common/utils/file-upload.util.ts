import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import * as sharp from "sharp";
import { randomUUID } from "crypto";
import { lookup as mimeLookup, extension as mimeExt } from "mime-types";

export type MulterFile = Express.Multer.File;

/** Accepted controller inputs */
export type UploadInput =
  | MulterFile
  | MulterFile[]
  | Record<string, MulterFile[] | undefined>;

export type ImageVariant = {
  type: "png" | "thumb";
  width?: number;
  height?: number;
  /** PNG compression level used (0..9) */
  quality?: number;
  path: string; // absolute disk path
  url: string; // web URL (/uploads/...)
  size: number; // bytes
};

export type SavedAsset = {
  id: string;
  field?: string; // when uploaded via fields
  originalName: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  ext: string; // file extension without leading dot
  path: string; // absolute path for primary variant (images) or raw file
  url: string; // web path
  variants?: ImageVariant[];
  width?: number;
  height?: number;
  createdAt: string;
};

export type ProcessOptions = {
  /** Base local directory (absolute or relative). Defaults to 'uploads'. */
  baseDir?: string;
  /** Optional subfolder to organize uploads (e.g., 'reports', 'avatars'). */
  subDir?: string;
  /** Public URL base. If you serve /uploads statically, default is '/'. */
  publicBase?: string;
  /** Max bounds for normalized originals (no upscaling). */
  imageMaxWidth?: number; // default 1600
  imageMaxHeight?: number; // default 1600

  quality?: number;

  makeThumb?: boolean;

  thumbWidth?: number;
  thumbHeight?: number;
};

const DEFAULTS: Required<
  Pick<
    ProcessOptions,
    | "baseDir"
    | "publicBase"
    | "imageMaxWidth"
    | "imageMaxHeight"
    | "quality"
    | "makeThumb"
    | "thumbWidth"
    | "thumbHeight"
  >
> = {
  baseDir: "uploads",
  publicBase: "/",
  imageMaxWidth: 1600,
  imageMaxHeight: 1600,
  quality: 82,
  makeThumb: true,
  thumbWidth: 480,
  thumbHeight: 360,
};

const IMG_MIME_RE = /^image\/(jpeg|png|webp|gif|svg\+xml|svg|bmp|tiff)$/i;

async function ensureDir(dirPath: string) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function safeFilename(
  original: string,
  mime: string,
): { name: string; ext: string } {
  const rawExt = path.extname(original).toLowerCase();
  const base = path.basename(original, rawExt);
  const safeBase =
    base.replace(/[^a-zA-Z0-9\-_.]+/g, "_").slice(0, 80) || "file";
  let ext = rawExt || "";
  if (!ext) {
    const guessed = mimeExt(mime || "") || "";
    ext = guessed ? `.${guessed}` : "";
  }
  return { name: safeBase, ext };
}

function buildPaths(
  opts: Required<typeof DEFAULTS> & ProcessOptions,
  subDir: string | undefined,
  filename: string,
) {
  const folder = subDir ? path.join(opts.baseDir, subDir) : opts.baseDir;
  const abs = path.resolve(folder, filename);
  // rel should be the path relative to process.cwd(), e.g. "uploads/reports/..."
  const rel = path.join(folder, filename).replace(/\\/g, "/");
  // ensure publicBase doesn't cause double slash
  const base = (opts.publicBase || "/").replace(/\/$/, "");
  const url = `${base}/${rel.replace(/^\//, "")}`;

  return { abs, url, folderAbs: path.resolve(folder) };
}

export async function saveRaw(
  file: MulterFile,
  opts: Required<typeof DEFAULTS> & ProcessOptions,
  subDir?: string,
): Promise<SavedAsset> {
  const id = randomUUID();
  const mime =
    file.mimetype ||
    mimeLookup(file.originalname) ||
    "application/octet-stream";
  const { name, ext } = safeFilename(file.originalname, String(mime));
  const filename = `${id}-${name}${ext || ""}`;
  const { abs, url, folderAbs } = buildPaths(opts, subDir, filename);
  await ensureDir(folderAbs);
  await fsp.writeFile(abs, file.buffer);
  const stat = await fsp.stat(abs);

  return {
    id,
    originalName: file.originalname,
    mimeType: String(mime),
    size: stat.size,
    isImage: IMG_MIME_RE.test(String(mime)),
    ext: (ext || "").replace(".", ""),
    path: abs,
    url,
    createdAt: new Date().toISOString(),
  };
}

export async function processImagePNG(
  file: MulterFile,
  opts: Required<typeof DEFAULTS> & ProcessOptions,
  subDir?: string,
): Promise<SavedAsset> {
  const id = randomUUID();
  const mime = file.mimetype || "image/png";
  const { name } = safeFilename(file.originalname, String(mime));

  const compressionLevel = Math.max(
    0,
    Math.min(9, Math.round((100 - (opts.quality ?? 82)) / 10)),
  );
  const pngOptions: sharp.PngOptions = {
    compressionLevel,
    adaptiveFiltering: true,
    palette: true,
  };

  const baseOut = `${id}-${name}-orig.png`;
  const {
    abs: baseAbs,
    url: baseUrl,
    folderAbs,
  } = buildPaths(opts, subDir, baseOut);
  await ensureDir(folderAbs);

  const img = sharp(file.buffer).rotate();
  const meta = await img.metadata();

  await img
    .clone()
    .resize(opts.imageMaxWidth, opts.imageMaxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .png(pngOptions)
    .toFile(baseAbs);

  const baseStat = await fsp.stat(baseAbs);

  const variants: ImageVariant[] = [
    {
      type: "png",
      path: baseAbs,
      url: baseUrl,
      size: baseStat.size,
      width: meta.width,
      height: meta.height,
      quality: compressionLevel,
    },
  ];

  // Thumbnail PNG
  if (opts.makeThumb) {
    const thumbName = `${id}-${name}-thumb.png`;
    const { abs: thumbAbs, url: thumbUrl } = buildPaths(
      opts,
      subDir,
      thumbName,
    );
    await img
      .clone()
      .resize(opts.thumbWidth, opts.thumbHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({
        ...pngOptions,
        compressionLevel: Math.min(9, compressionLevel + 1),
      })
      .toFile(thumbAbs);

    const tStat = await fsp.stat(thumbAbs);
    variants.push({
      type: "thumb",
      path: thumbAbs,
      url: thumbUrl,
      size: tStat.size,
      width: opts.thumbWidth,
      height: opts.thumbHeight,
      quality: Math.min(9, compressionLevel + 1),
    });
  }

  return {
    id,
    originalName: file.originalname,
    mimeType: String(mime),
    size: file.size,
    isImage: true,
    ext: "png",
    path: variants[0].path,
    url: variants[0].url,
    variants,
    width: meta.width,
    height: meta.height,
    createdAt: new Date().toISOString(),
  };
}

function isMulterFile(v: any): v is MulterFile {
  return !!v && typeof v === "object" && "originalname" in v && "buffer" in v;
}

export async function processUploads(
  input: UploadInput,
  options: ProcessOptions = {},
  subDir?: string,
): Promise<SavedAsset[]> {
  const opts = { ...DEFAULTS, ...options };

  const items: { field?: string; file: MulterFile }[] = [];
  if (!input) return [];

  if (Array.isArray(input)) {
    input.forEach((f) => f && items.push({ file: f }));
  } else if (isMulterFile(input)) {
    items.push({ file: input });
  } else {
    Object.entries(input).forEach(([field, arr]) => {
      (arr || []).forEach((f) => f && items.push({ field, file: f }));
    });
  }

  const results: SavedAsset[] = [];
  for (const item of items) {
    const mime = item.file.mimetype || mimeLookup(item.file.originalname) || "";
    const isImage = IMG_MIME_RE.test(String(mime));
    const asset = isImage
      ? await processImagePNG(item.file, opts, subDir)
      : await saveRaw(item.file, opts, subDir);
    if (item.field) asset.field = item.field;
    results.push(asset);
  }
  return results;
}
