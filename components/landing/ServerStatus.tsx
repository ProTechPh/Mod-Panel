'use client';

import { useEffect, useState } from 'react';
import { Signal, Activity, Cpu, Cloud, ShieldCheck } from 'lucide-react';

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
  { name: 'Delivery Engine', icon: <Activity size={14} /> },
  { name: 'Anti-Ban Module', icon: <ShieldCheck size={14} /> },
  { name: 'Kernel Bypass', icon: <Cpu size={14} /> },
  { name: 'Update Server', icon: <Cloud size={14} /> },
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

  const services: ServiceStatus[] = SERVICES_TEMPLATE.map((s) => ({
    ...s,
    badge: isActive ? 'online' : 'updating',
    label: isActive ? 'Online' : 'Updating',
  }));

  return (
    <div className="panel fade-up d4" id="status">
      <div className="panel-head">
        <h2 className="panel-title">
          <Signal size={14} className="text-orange-500" />
          <span>System Diagnostics</span>
        </h2>
        <span className="panel-badge">API OK</span>
      </div>

      <div className="status-list">
        {services.map((service) => (
          <div key={service.name} className="status-row">
            <div className="status-name">
              <span className="ico">{service.icon}</span>
              <span>{service.name}</span>
            </div>
            <span className={`status-badge ${service.badge}`}>
              {service.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
