import { Logger } from '@/lib/utils';

export async function shortenUrl(url: string, alias?: string): Promise<string | null> {
  const apiToken = process.env.RESHORTFLY_API_TOKEN;
  if (!apiToken) {
    Logger.error('RESHORTFLY_API_TOKEN is not set');
    return null;
  }

  const encodedUrl = encodeURIComponent(url);
  const apiUrl = `https://reshortfly.com/api?api=${apiToken}&url=${encodedUrl}${alias ? `&alias=${alias}` : ''}&format=text`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      Logger.error('ReShortFly API error', { statusText: response.statusText });
      return null;
    }
    const shortUrl = await response.text();
    return shortUrl.trim() || null;
  } catch (error) {
    Logger.error('ReShortFly fetch error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}
