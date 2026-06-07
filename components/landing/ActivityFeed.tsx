'use client';

import { Bell } from 'lucide-react';
import '@/components/landing/landing.css';

interface ActivityFeedProps {
  version: string;
}

export function ActivityFeed({ version }: ActivityFeedProps) {
  return (
    <div className="panel fade-up d4 panel-corner">
      <div className="panel-head">
        <div className="panel-title">
          <Bell className="ico" size={16} />
          Activity Feed
        </div>
        <span className="panel-badge">Live</span>
      </div>

      <div className="activity-list">
        <div className="activity-item">
          <span className="activity-dot green" />
          <div>
            <div className="activity-text">
              <strong>System v{version}</strong> — deployed and stable across all clusters.
            </div>
            <div className="activity-time">Latest release</div>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot" />
          <div>
            <div className="activity-text">
              <strong>Instant Delivery</strong> — keys issued in under 3 seconds.
            </div>
            <div className="activity-time">Always on</div>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot gold" />
          <div>
            <div className="activity-text">
              <strong>Premium Arsenal</strong> — ESP, Aimbot, Silent Aim and more.
            </div>
            <div className="activity-time">8 modules</div>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot purple" />
          <div>
            <div className="activity-text">
              <strong>24/7 Support</strong> — Telegram helpdesk always online.
            </div>
            <div className="activity-time">t.me/CanKillYouForever</div>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot green" />
          <div>
            <div className="activity-text">
              <strong>Secure Payments</strong> — encrypted transactions via trusted gateway.
            </div>
            <div className="activity-time">Always encrypted</div>
          </div>
        </div>
      </div>
    </div>
  );
}
