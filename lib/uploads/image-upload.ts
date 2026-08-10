export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const ROOM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const BACKGROUND_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export type ImageUploadPrefix = "rooms" | "backgrounds";

const EXTENSION_BY_CONTENT_TYPE: Record<
  (typeof IMAGE_CONTENT_TYPES)[number],
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function isAllowedImageContentType(
  contentType: string
): contentType is (typeof IMAGE_CONTENT_TYPES)[number] {
  return IMAGE_CONTENT_TYPES.includes(
    contentType as (typeof IMAGE_CONTENT_TYPES)[number]
  );
}

export function getImageUploadPath(
  prefix: ImageUploadPrefix,
  contentType: string
) {
  if (!isAllowedImageContentType(contentType)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, AVIF");
  }

  return `${prefix}/image.${EXTENSION_BY_CONTENT_TYPE[contentType]}`;
}

export function validateImageFile(file: File, maximumSizeInBytes: number) {
  if (!isAllowedImageContentType(file.type)) {
    return "Invalid file type. Allowed: JPEG, PNG, WebP, AVIF";
  }

  if (file.size > maximumSizeInBytes) {
    return `File too large. Maximum ${maximumSizeInBytes / 1024 / 1024} MB`;
  }

  return null;
}
