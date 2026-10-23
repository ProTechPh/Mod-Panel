'use client';

import Script from 'next/script';

export const ADSTERRA_SMARTLINK_URL = 'https://araplhn.org/4/e637ebd3d1b913f8f88bc69debe16ee4';

type BannerProps = {
  placementKey: string;
  width: 300 | 728;
  height: 90 | 250;
  className?: string;
  title: string;
};

export function AdsterraBanner({
  placementKey,
  width,
  height,
  className = '',
  title,
}: BannerProps) {
  const source = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#101116}body{display:flex;align-items:center;justify-content:center}</style>
  </head>
  <body>
    <script>window.atOptions={key:'${placementKey}',format:'iframe',height:${height},width:${width},params:{}};</script>
    <script src="https://bauval.org/22/${placementKey}"></script>
  </body>
</html>`;

  return (
    <div
      className={`ad-slot ${className}`.trim()}
      aria-label="Advertisement"
      style={{ minHeight: height }}
    >
      <iframe
        title={title}
        srcDoc={source}
        width={width}
        height={height}
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        style={{ display: 'block', border: 0, background: '#101116' }}
      />
    </div>
  );
}

export function AdsterraNativeBanner() {
  return (
    <section className="ad-native" aria-label="Sponsored content">
      <div id="container-807908b34d7a99f7a4458e8b9cf6a29c" />
      <Script
        id="adsterra-native-banner"
        src="https://bauval.org/21/807908b34d7a99f7a4458e8b9cf6a29c"
        strategy="afterInteractive"
        data-cfasync="false"
      />
    </section>
  );
}

export function AdsterraSmartlink() {
  return (
    <a
      href={ADSTERRA_SMARTLINK_URL}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="ad-smartlink"
    >
      <span className="ad-smartlink-kicker">Sponsored</span>
      <span className="ad-smartlink-title">Unlock today&apos;s featured offer</span>
      <span className="ad-smartlink-cta">Open offer</span>
    </a>
  );
}

export function AdsterraPageScripts() {
  return (
    <>
      <Script
        id="adsterra-popunder"
        src="https://abscloud.org/1/dabdcee41a6238333374ec189716549e"
        strategy="afterInteractive"
        data-cfasync="false"
      />
      <Script
        id="adsterra-social-bar"
        src="https://bauval.org/14/3973f36a409e7e9db9d8994b94e20d7f"
        strategy="afterInteractive"
        data-cfasync="false"
      />
    </>
  );
}
