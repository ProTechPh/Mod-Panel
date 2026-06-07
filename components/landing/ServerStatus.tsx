'use client';

import { useEffect, useState } from 'react';
import { Signal, Activity, Cpu, Lock, Cloud, ShieldCheck, Wrench } from 'lucide-react';
import '@/components/landing/landing.css';

interface StatusData {
  status: string;
  maintenance: string;
  maintenanceMessage: string;
  activePlayers: number;
  totalSlots: number;
  version: string;
  modName: string;
}

interface ServiceStatus {
  name: string;
  icon: React.ReactNode;
  badge: 'online' | 'updating' | 'offline';
  label: string;
}

const SERVICES_TEMPLATE: Omit<ServiceStatus, 'badge' | 'label'>[] = [
  { name: 'Delivery Engine', icon: <Activity size={13} /> },
  { name: 'Anti-Ban Module', icon: <ShieldCheck size={13} /> },
  { name: 'Kernel Bypass', icon: <Cpu size={13} /> },
  { name: 'Update Server', icon: <Cloud size={13} /> },
];

export function ServerStatus() {
  const [data, setData] = useState<StatusData>({
    status: 'active',
    maintenance: 'off',
    maintenanceMessage: '',
    activePlayers: 0,
    totalSlots: 500,
    version: 'v3.2',
    modName: '',
  });

  useEffect(() => {
    fetch('/api/server-status')
      .then(res => res.json())
      .then(json => json.data && setData(prev => ({ ...prev, ...json.data })))
      .catch(() => {});
  }, []);

  const isActive = data.status === 'active' && data.maintenance === 'off';
  const allOnline = isActive;

  const services: ServiceStatus[] = SERVICES_TEMPLATE.map((s) => ({
    ...s,
    badge: isActive ? 'online' : 'updating',
    label: isActive
      ? s.name === 'Delivery Engine' ? 'Online'
        : s.name === 'Anti-Ban Module' ? 'Active'
        : s.name === 'Kernel Bypass' ? 'Running'
        : 'Synced'
      : 'Updating',
  }));

  return (
    <div className="panel fade-up d3 panel-corner" id="status">
      <div className="panel-head">
        <div className="panel-title">
          <Signal className="ico" size={16} />
          System Status
        </div>
        <span
          className="panel-badge"
          style={
            allOnline
              ? { background: 'rgba(57, 255, 20, 0.08)', borderColor: 'rgba(57, 255, 20, 0.25)', color: '#86efac' }
              : { background: 'rgba(240, 192, 64, 0.08)', borderColor: 'rgba(240, 192, 64, 0.25)', color: '#fcd34d' }
          }
        >
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: allOnline ? 'var(--ecto-green)' : 'var(--gold)',
              marginRight: '0.35rem',
              boxShadow: `0 0 5px ${allOnline ? 'var(--ecto-green)' : 'var(--gold)'}`,
            }}
          />
          {allOnline ? 'All Operational' : 'Updating'}
        </span>
      </div>

      <div className="status-list">
        {services.map((service) => (
          <div key={service.name} className="status-row">
            <span className="status-name">
              <span className="ico">{service.icon}</span>
              {service.name}
            </span>
            <span className={`status-badge ${service.badge}`}>{service.label}</span>
          </div>
        ))}
        {data.maintenance === 'on' && (
          <div className="status-row">
            <span className="status-name">
              <span className="ico"><Wrench size={13} /></span>
              Maintenance Mode
            </span>
            <span className="status-badge updating">Scheduled</span>
          </div>
        )}
      </div>
    </div>
  );
}
