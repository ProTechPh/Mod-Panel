'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, Zap, Shield, Package } from 'lucide-react';
import '@/components/landing/landing.css';

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
    <div className="panel fade-up d3 panel-corner" id="downloads">
      <div className="panel-head">
        <div className="panel-title">
          <Package className="ico" size={16} />
          Client Downloads
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="panel-badge">{links.length + VIRTUAL_APPS.length} files</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2.5rem 1.4rem', textAlign: 'center' }}>
          <div
            className="inline-block size-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(20, 184, 184, 0.2)', borderTopColor: 'var(--teal-2)' }}
          />
          <p className="mt-3 text-sm font-mono" style={{ color: 'var(--text-lo)' }}>Loading releases…</p>
        </div>
      ) : links.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-ring">
            <Smartphone size={26} />
          </div>
          <div className="empty-title">No Builds Available</div>
          <div className="empty-sub">Check back soon for the latest client release.</div>
        </div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Build</th>
              <th>Version</th>
              <th>Size</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link._id}>
                <td>
                  <div className="order-product">
                    <div className="order-img-placeholder">
                      <Smartphone size={14} />
                    </div>
                    <div>
                      <div className="order-name">{link.appName}</div>
                      <div className="order-name sub">CLIENT BUILD</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="key-chip">
                    <Zap size={9} style={{ marginRight: 4 }} />
                    v{link.version || '—'}
                  </span>
                </td>
                <td className="order-date">{link.fileSize || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <a
                    href={link.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="product-card-cta"
                    style={{ padding: '0.4rem 0.85rem' }}
                  >
                    <Download size={11} />
                    Get
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Virtual Apps subsection */}
      <div className="panel-head" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="panel-title">
          <Shield className="ico" size={16} />
          Virtual Apps
        </div>
        <span className="panel-badge">{VIRTUAL_APPS.length} tools</span>
      </div>

      <table className="orders-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>Type</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {VIRTUAL_APPS.map((app) => (
            <tr key={app.name}>
              <td>
                <div className="order-product">
                  <div className="order-img-placeholder" style={{ background: 'rgba(57, 255, 20, 0.06)', color: 'var(--ecto-green)' }}>
                    <Shield size={14} />
                  </div>
                  <div>
                    <div className="order-name">{app.name}</div>
                    <div className="order-name sub">VIRTUAL</div>
                  </div>
                </div>
              </td>
              <td>
                {app.recommended ? (
                  <span
                    className="key-chip"
                    style={{
                      background: 'rgba(240, 192, 64, 0.07)',
                      borderColor: 'rgba(240, 192, 64, 0.18)',
                      color: 'var(--gold)',
                    }}
                  >
                    ★ Recommended
                  </span>
                ) : (
                  <span className="order-date">Standard</span>
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-card-cta"
                  style={{
                    padding: '0.4rem 0.85rem',
                    background: app.recommended
                      ? 'linear-gradient(135deg, var(--gold), #d4a02a)'
                      : undefined,
                  }}
                >
                  <Download size={11} />
                  Get
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
