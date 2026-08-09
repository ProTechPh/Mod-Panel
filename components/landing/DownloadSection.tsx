'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, Shield, Radio } from 'lucide-react';

interface DownloadLink {
  _id: string;
  appName: string;
  downloadUrl: string;
  version?: string;
  fileSize?: string;
}

const VIRTUAL_APPS = [
  { name: 'ChoRok Virtual V2', url: 'https://www.mediafire.com/file/ruh6p6m36o9hv47/ChoRok_Virtual_V2.apk/file', recommended: true },
  { name: 'ChoRok Virtual', url: 'https://www.mediafire.com/file/v0j99yby45pluo8/ChoRok_Virtual.apk/file' },
  { name: 'GODZ Virtual', url: 'https://www.mediafire.com/file/73jpkuwb9tpjye6/GODZ_VIRTUAL.apk/file' },
  { name: 'GSPACE Virtual', url: 'https://www.mediafire.com/file/4v1miuim8209lio/GSPACE_VIRTUAL.apk/file' },
  { name: 'MIKASA Virtual V2', url: 'https://www.mediafire.com/file/ljfn9bjhmlmbobk/MIKASA_VIRTUAL_V2.apk/file' },
  { name: 'OpsTG Virtual V2', url: 'https://www.mediafire.com/file/l07bj31supspspz/OpsTG_VIRTUAL__%255BV2%255D_OpsTG_%255BV2%255D.apk/file' },
  { name: 'Virtual Mod', url: 'https://www.mediafire.com/file/syxeaxm7om7izs3/VIRTUAL_MOD.apk/file' },
  { name: 'Alexa Virtual (64Bit) - Fixed', url: 'https://www.mediafire.com/file/r9jftm7r8vjujf5/%255BFIXED%255D_Alexa_Virtual_-_64Bit.apk/file' },
];

export function DownloadSection() {
  const [links, setLinks] = useState<DownloadLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/download')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLinks(data);
      })
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="downloads-section" id="downloads">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <span className="section-label" style={{ fontFamily: 'var(--ff-mono)' }}>
          [ LAUNCHER CLIENTS ]
        </span>
        <h2 className="section-title" style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Platform Download Center
        </h2>
        <p className="section-description">
          Deploy client loaders to launch mods directly on your device.
        </p>
      </div>

      <div className="downloads-grid">
        {/* Client Builds */}
        {loading ? (
          <div className="downloads-loading panel">
            <div className="loading-spinner" style={{ marginBottom: '1rem' }} />
            <p className="font-mono text-xs text-slate-500">Querying platform releases...</p>
          </div>
        ) : links.length > 0 ? (
          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title">
                <Smartphone size={14} className="text-orange-500" />
                <span>Mod App Builders</span>
              </h3>
              <span className="panel-badge">RELEASE</span>
            </div>
            
            <div className="downloads-list">
              {links.map((link) => (
                <div key={link._id} className="download-item">
                  <div className="download-info">
                    <span className="download-name">{link.appName}</span>
                    <span className="download-meta font-mono">v{link.version || '—'} · {link.fileSize || '—'}</span>
                  </div>
                  <a
                    href={link.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.7rem' }}
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Virtual Apps */}
        <div className="panel">
          <div className="panel-head">
            <h3 className="panel-title">
              <Shield size={14} className="text-orange-500" />
              <span>Recommended Virtual Apps</span>
            </h3>
            <span className="panel-badge">SANDBOX</span>
          </div>

          <div className="downloads-list">
            {VIRTUAL_APPS.map((app) => (
              <div key={app.name} className="download-item">
                <div className="download-info">
                  <span className="download-name">{app.name}</span>
                  {app.recommended && (
                    <span className="status-pill-gold" style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem', marginTop: '0.2rem' }}>
                      Recommended
                    </span>
                  )}
                </div>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={app.recommended ? 'btn-primary' : 'btn-outline'}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.7rem' }}
                >
                  <Download size={12} />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
