const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID

export async function purgeCloudflareCache(urls: string[]) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    console.warn('[Cloudflare] Missing API_TOKEN or ZONE_ID — skipping purge')
    return
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: urls }),
      }
    )

    const body = await res.json() as { success: boolean; errors: unknown[] }
    if (!res.ok || !body.success) {
      console.error('[Cloudflare] Purge failed:', JSON.stringify(body.errors || body))
    }
  } catch (err) {
    console.error('[Cloudflare] Purge error:', err)
  }
}

export function getLibServeUrl(fileName: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://mod-panel.protech.works'
  return `${origin}/api/libs/serve/${encodeURIComponent(fileName)}`
}
