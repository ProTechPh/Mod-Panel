export async function shortenUrl(url: string, alias?: string): Promise<string | null> {
  const apiToken = process.env.RESHORTFLY_API_TOKEN;
  if (!apiToken) {
    console.error('RESHORTFLY_API_TOKEN is not set');
    return null;
  }

  const encodedUrl = encodeURIComponent(url);
  const apiUrl = `https://reshortfly.com/api?api=${apiToken}&url=${encodedUrl}${alias ? `&alias=${alias}` : ''}&format=text`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error('ReShortFly API error:', response.statusText);
      return null;
    }
    const shortUrl = await response.text();
    return shortUrl.trim() || null;
  } catch (error) {
    console.error('ReShortFly fetch error:', error);
    return null;
  }
}
