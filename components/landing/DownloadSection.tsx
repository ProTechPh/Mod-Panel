'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, Shield } from 'lucide-react';

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
      <div className="section-header">
        <span className="section-label">DOWNLOADS</span>
        <h2 className="section-title">Client Downloads</h2>
        <p className="section-description">
          Get the latest builds and tools.
        </p>
      </div>

      <div className="downloads-grid">
        {/* Client Builds */}
        {loading ? (
          <div className="downloads-loading">
            <div className="downloads-spinner" />
            <p>Loading releases...</p>
          </div>
        ) : links.length > 0 ? (
          <div className="downloads-category">
            <h3 className="downloads-category-title">
              <Smartphone size={16} />
              Client Builds
            </h3>
            <div className="downloads-list">
              {links.map((link) => (
                <div key={link._id} className="download-item">
                  <div className="download-info">
                    <span className="download-name">{link.appName}</span>
                    <span className="download-meta">v{link.version || '—'} · {link.fileSize || '—'}</span>
                  </div>
                  <a
                    href={link.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-btn"
                  >
                    <Download size={14} />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Virtual Apps */}
        <div className="downloads-category">
          <h3 className="downloads-category-title">
            <Shield size={16} />
            Virtual Apps
          </h3>
          <div className="downloads-list">
            {VIRTUAL_APPS.map((app) => (
              <div key={app.name} className="download-item">
                <div className="download-info">
                  <span className="download-name">{app.name}</span>
                  {app.recommended && (
                    <span className="download-badge">Recommended</span>
                  )}
                </div>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`download-btn ${app.recommended ? 'download-btn-primary' : ''}`}
                >
                  <Download size={14} />
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
