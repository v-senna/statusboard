import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wifi, WifiOff, Gauge, Activity, ShieldOff, Database,
  Users, Server, FolderSync, Printer, MessageCircle, ArrowRight
} from 'lucide-react';
import { SERVICES, UNITS, getUnitStatus, getRecentReportsForUnit, seedDemoData, type Service } from '../data/store';

const ICON_MAP: Record<string, React.ElementType> = {
  Wifi, WifiOff, Gauge, Activity, ShieldOff, Database,
  Users, Server, FolderSync, Printer, MessageCircle,
};

const STATUS_LABEL: Record<string, string> = {
  NORMAL: 'Normal',
  WARNING: 'Atenção',
  CRITICAL: 'Problema',
};

const STATUS_DESC: Record<string, string> = {
  NORMAL: 'Funcionando normalmente',
  WARNING: 'Alguns relatos recentes',
  CRITICAL: 'Muitos relatos — possível indisponibilidade',
};

export default function Dashboard() {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    seedDemoData();
  }, []);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredServices = activeService
    ? SERVICES.filter(s => s.id === activeService)
    : SERVICES;

  return (
    <>
      <p className="page-subtitle">
        Verifique o status da rede e dos sistemas em sua unidade antes de abrir um chamado.
      </p>

      {/* Service Selector Tabs */}
      <div className="service-tabs">
        <button
          className={`service-tab ${activeService === null ? 'active' : ''}`}
          onClick={() => setActiveService(null)}
        >
          <Activity size={16} />
          Todos
        </button>
        {SERVICES.map(service => {
          const Icon = ICON_MAP[service.icon] || Activity;
          return (
            <button
              key={service.id}
              className={`service-tab ${activeService === service.id ? 'active' : ''}`}
              onClick={() => setActiveService(activeService === service.id ? null : service.id)}
            >
              <Icon size={16} />
              {service.name}
            </button>
          );
        })}
      </div>

      {/* Unit Cards Grid */}
      <div className="unit-grid">
        {UNITS.map(unit => {
          const status = getUnitStatus(unit.id);
          const recentReports = getRecentReportsForUnit(unit.id, 15);
          const count = activeService
            ? recentReports.filter(r => r.serviceId === activeService).length
            : recentReports.length;

          return (
            <Link
              to={`/unit/${unit.id}`}
              key={unit.id}
              className={`unit-card status-${status}`}
            >
              <div className="unit-card-header">
                <span className="unit-name">{unit.name}</span>
                <div className="status-badge">
                  <span className="dot"></span>
                  {STATUS_LABEL[status]}
                </div>
              </div>
              <div className="unit-card-body">
                <div className="count">{count}</div>
                <span>relatos nos últimos 15 min</span>
              </div>
              {status === 'CRITICAL' && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.78rem', 
                  color: 'var(--red)', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  ⚠ Possível indisponibilidade coletiva
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
