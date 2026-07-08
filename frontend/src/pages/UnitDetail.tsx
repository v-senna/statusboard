import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft, Wifi, WifiOff, Gauge, Activity, ShieldOff,
  Database, Users, Server, FolderSync, Printer, MessageCircle, CheckCircle
} from 'lucide-react';
import {
  SERVICES, UNITS, getUnitStatus, getRecentReportsForUnit,
  getReportsForUnit, getChartData, addReport
} from '../data/store';

const ICON_MAP: Record<string, React.ElementType> = {
  Wifi, WifiOff, Gauge, Activity, ShieldOff, Database,
  Users, Server, FolderSync, Printer, MessageCircle,
};

export default function UnitDetail() {
  const { id } = useParams();
  const unitId = parseInt(id || '1');
  const unit = UNITS.find(u => u.id === unitId);

  const [, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [reported, setReported] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!unit) return <div>Unidade não encontrada</div>;

  const status = getUnitStatus(unitId);
  const recentReports = getRecentReportsForUnit(unitId, 15);
  const allReports = getReportsForUnit(unitId, 24);
  const chartData = getChartData(unitId);

  const handleReport = (serviceId: string, serviceName: string) => {
    addReport({ unitId, serviceId, problemType: serviceId });
    setReported(prev => new Set([...prev, serviceId]));
    setToast(`✓ Problema "${serviceName}" registrado com sucesso!`);
    refresh();
    setTimeout(() => setToast(null), 3000);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Voltar para todas as unidades
      </Link>

      <div className="detail-header">
        <h2>{unit.name}</h2>
        <div className={`status-badge status-${status}`} style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
          <span className="dot" style={{ width: 8, height: 8 }}></span>
          {status === 'NORMAL' ? 'Normal' : status === 'WARNING' ? 'Atenção' : 'Crítico'}
        </div>
      </div>

      {/* Alerts */}
      {status === 'CRITICAL' && (
        <div className="alert alert-critical">
          <Activity size={20} />
          <div>
            <strong>Possível indisponibilidade coletiva detectada!</strong>
            <span style={{ marginLeft: '0.5rem' }}>
              {recentReports.length} relatos nos últimos 15 min. Nossa equipe já foi notificada.
            </span>
          </div>
        </div>
      )}

      {status === 'WARNING' && (
        <div className="alert alert-warning">
          <Activity size={20} />
          Outras <strong style={{ margin: '0 0.3rem' }}>{recentReports.length}</strong> pessoas reportaram problemas nos últimos 15 minutos.
        </div>
      )}

      {status === 'NORMAL' && recentReports.length === 0 && (
        <div className="alert alert-info">
          <CheckCircle size={20} />
          Nenhum relato recente para esta unidade. Tudo funcionando normalmente.
        </div>
      )}

      {/* Chart */}
      <div className="chart-card">
        <h3>Relatos nas últimas 24 horas</h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                minTickGap={50}
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#2d3348' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '0.85rem'
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="relatos"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Problem Buttons */}
      <div className="problems-section">
        <h3>Qual problema você está enfrentando?</h3>
        <div className="problems-grid">
          {SERVICES.map(service => {
            const Icon = ICON_MAP[service.icon] || Activity;
            const isReported = reported.has(service.id);
            return (
              <button
                key={service.id}
                className={`problem-btn ${isReported ? 'reported' : ''}`}
                onClick={() => handleReport(service.id, service.name)}
              >
                {isReported ? <CheckCircle size={28} /> : <Icon size={28} />}
                <span>{isReported ? 'Registrado!' : service.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      {allReports.length > 0 && (
        <div className="reports-card">
          <h3>Últimos relatos ({allReports.length})</h3>
          {allReports.slice(0, 15).map(report => {
            const service = SERVICES.find(s => s.id === report.serviceId);
            const Icon = service ? (ICON_MAP[service.icon] || Activity) : Activity;
            return (
              <div key={report.id} className="report-item">
                <div className="report-item-left">
                  <Icon size={16} style={{ color: 'var(--text-dim)' }} />
                  <span>{service?.name || report.problemType}</span>
                </div>
                <span className="report-time">{formatTime(report.reportedAt)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
