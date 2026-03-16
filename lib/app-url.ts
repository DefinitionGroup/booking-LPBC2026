type HeaderGetter = Pick<Headers, "get">;

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function getAppUrl(headersList?: HeaderGetter) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  const host =
    headersList?.get("x-forwarded-host") ||
    headersList?.get("host") ||
    "localhost:3000";
  const proto =
    headersList?.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}
