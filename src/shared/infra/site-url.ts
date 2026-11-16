export function getSiteUrl(): URL | null {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl) return null;

  const siteUrl = new URL(configuredUrl);
  if (siteUrl.protocol !== 'https:' && siteUrl.protocol !== 'http:') {
    throw new Error('NEXT_PUBLIC_APP_URL deve usar o protocolo HTTP ou HTTPS.');
  }
  if (
    siteUrl.username ||
    siteUrl.password ||
    siteUrl.pathname !== '/' ||
    siteUrl.search ||
    siteUrl.hash
  ) {
    throw new Error('NEXT_PUBLIC_APP_URL deve conter somente a origem pública do site.');
  }

  return siteUrl;
}
