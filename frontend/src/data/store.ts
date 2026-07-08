export interface Service {
  id: string;
  name: string;
  icon: string;
  category: 'network' | 'system' | 'hardware';
}

export interface Unit {
  id: number;
  name: string;
}

export interface Report {
  id: string;
  unitId: number;
  serviceId: string;
  problemType: string;
  reportedAt: string;
  userComment?: string;
}

export const SERVICES: Service[] = [
  { id: 'internet', name: 'Internet', icon: 'Wifi', category: 'network' },
  { id: 'internet-lenta', name: 'Internet Lenta', icon: 'Gauge', category: 'network' },
  { id: 'oscilacao', name: 'Oscilação', icon: 'Activity', category: 'network' },
  { id: 'wifi', name: 'Wi-Fi Indisponível', icon: 'WifiOff', category: 'network' },
  { id: 'vpn', name: 'VPN não conecta', icon: 'ShieldOff', category: 'network' },
  { id: 'erp', name: 'ERP não acessa', icon: 'Database', category: 'system' },
  { id: 'crm', name: 'Sistema CRM', icon: 'Users', category: 'system' },
  { id: 'sistema-interno', name: 'Sistema Interno', icon: 'Server', category: 'system' },
  { id: 'compartilhamento', name: 'Compartilhamentos', icon: 'FolderSync', category: 'system' },
  { id: 'impressora', name: 'Impressoras', icon: 'Printer', category: 'hardware' },
  { id: 'outro', name: 'Outro', icon: 'MessageCircle', category: 'system' },
];

export const UNITS: Unit[] = [
  { id: 1, name: 'Matriz' },
  { id: 2, name: 'Filial' },
  { id: 3, name: 'Serra Azul' },
  { id: 4, name: 'Piso Forte' },
  { id: 5, name: 'Cecafi RN' },
];

const STORAGE_KEY = 'statusboard_reports';

export function getReports(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addReport(report: Omit<Report, 'id' | 'reportedAt'>): Report {
  const reports = getReports();
  const newReport: Report = {
    ...report,
    id: crypto.randomUUID(),
    reportedAt: new Date().toISOString(),
  };
  reports.push(newReport);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  return newReport;
}

export function getReportsForUnit(unitId: number, hoursBack = 24): Report[] {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  return getReports().filter(r => r.unitId === unitId && r.reportedAt >= cutoff);
}

export function getRecentReportsForUnit(unitId: number, minutesBack = 15): Report[] {
  const cutoff = new Date(Date.now() - minutesBack * 60 * 1000).toISOString();
  return getReports().filter(r => r.unitId === unitId && r.reportedAt >= cutoff);
}

export function getUnitStatus(unitId: number): 'NORMAL' | 'WARNING' | 'CRITICAL' {
  const recent = getRecentReportsForUnit(unitId, 15);
  if (recent.length >= 5) return 'CRITICAL';
  if (recent.length >= 2) return 'WARNING';
  return 'NORMAL';
}

export function getChartData(unitId: number) {
  const reports = getReportsForUnit(unitId, 24);
  const now = new Date();
  const buckets = [];
  for (let i = 48; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    const bucketStart = time.getTime();
    const bucketEnd = bucketStart + 30 * 60 * 1000;
    const count = reports.filter(r => {
      const t = new Date(r.reportedAt).getTime();
      return t >= bucketStart && t < bucketEnd;
    }).length;
    const hours = time.getHours().toString().padStart(2, '0');
    const mins = time.getMinutes().toString().padStart(2, '0');
    buckets.push({ time: `${hours}:${mins}`, relatos: count });
  }
  return buckets;
}

export function seedDemoData() {
  const existing = getReports();
  if (existing.length > 0) return;
  const now = Date.now();
  const demoReports: Report[] = [];
  const problemTypes = ['internet', 'internet-lenta', 'oscilacao', 'vpn', 'crm', 'erp'];
  // Filial - simulate outage
  for (let i = 0; i < 12; i++) {
    demoReports.push({
      id: crypto.randomUUID(),
      unitId: 2,
      serviceId: problemTypes[i % 3],
      problemType: problemTypes[i % 3],
      reportedAt: new Date(now - (Math.random() * 10) * 60 * 1000).toISOString(),
    });
  }
  // Serra Azul - some reports
  for (let i = 0; i < 3; i++) {
    demoReports.push({
      id: crypto.randomUUID(),
      unitId: 3,
      serviceId: 'internet-lenta',
      problemType: 'internet-lenta',
      reportedAt: new Date(now - (Math.random() * 12) * 60 * 1000).toISOString(),
    });
  }
  // Historical for Matriz
  for (let i = 0; i < 8; i++) {
    demoReports.push({
      id: crypto.randomUUID(),
      unitId: 1,
      serviceId: problemTypes[i % problemTypes.length],
      problemType: problemTypes[i % problemTypes.length],
      reportedAt: new Date(now - (2 + Math.random() * 4) * 60 * 60 * 1000).toISOString(),
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoReports));
}
