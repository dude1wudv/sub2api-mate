import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DashboardStats } from '@/src/types/admin';

export const SUB2API_WIDGET_NAME = 'Sub2ApiDashboard';
export const SUB2API_WIDGET_STORAGE_KEY =
  'sub2api-mate.widget.dashboard.snapshot.v1';

export type WidgetRole = 'admin' | 'user' | 'unknown';

export interface Sub2ApiWidgetSnapshot {
  schemaVersion: 1 | 2;
  role: WidgetRole;
  serverLabel: string;
  totalUsers: number;
  activeUsers: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  todayRequests: number;
  todayTokens: number;
  todayCost: number;
  rpm: number;
  tpm: number;
  totalAccounts: number;
  normalAccounts: number;
  errorAccounts: number;
  balance: number | null;
  updatedAt: string;
}

export const EMPTY_WIDGET_SNAPSHOT: Sub2ApiWidgetSnapshot = {
  schemaVersion: 2,
  role: 'unknown',
  serverLabel: '尚未连接 Sub2API',
  totalUsers: 0,
  activeUsers: 0,
  totalApiKeys: 0,
  activeApiKeys: 0,
  totalRequests: 0,
  totalTokens: 0,
  totalCost: 0,
  todayRequests: 0,
  todayTokens: 0,
  todayCost: 0,
  rpm: 0,
  tpm: 0,
  totalAccounts: 0,
  normalAccounts: 0,
  errorAccounts: 0,
  balance: null,
  updatedAt: '',
};

function finiteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function serverLabel(baseUrl: string | undefined): string {
  if (!baseUrl) return 'Sub2API';

  try {
    const url = new URL(baseUrl);
    return url.host || url.hostname || 'Sub2API';
  } catch {
    return baseUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Sub2API';
  }
}

export function createWidgetSnapshot(
  stats: DashboardStats,
  options: {
    baseUrl?: string;
    role?: WidgetRole;
    balance?: number | null;
  } = {}
): Sub2ApiWidgetSnapshot {
  return {
    schemaVersion: 2,
    role: options.role ?? 'unknown',
    serverLabel: serverLabel(options.baseUrl),
    totalUsers: finiteNumber(stats.total_users),
    activeUsers: finiteNumber(stats.active_users),
    totalApiKeys: finiteNumber(stats.total_api_keys),
    activeApiKeys: finiteNumber(stats.active_api_keys),
    totalRequests: finiteNumber(stats.total_requests),
    totalTokens: finiteNumber(stats.total_tokens),
    totalCost: finiteNumber(stats.total_cost),
    todayRequests: finiteNumber(stats.today_requests),
    todayTokens: finiteNumber(stats.today_tokens),
    todayCost: finiteNumber(stats.today_cost),
    rpm: finiteNumber(stats.rpm),
    tpm: finiteNumber(stats.tpm),
    totalAccounts: finiteNumber(stats.total_accounts),
    normalAccounts: finiteNumber(stats.normal_accounts),
    errorAccounts: finiteNumber(stats.error_accounts),
    balance:
      options.balance !== undefined && options.balance !== null
        ? finiteNumber(options.balance)
        : null,
    updatedAt: new Date().toISOString(),
  };
}

function isSnapshot(value: unknown): value is Sub2ApiWidgetSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<Sub2ApiWidgetSnapshot>;
  return (
    (snapshot.schemaVersion === 1 || snapshot.schemaVersion === 2) &&
    typeof snapshot.serverLabel === 'string' &&
    typeof snapshot.updatedAt === 'string'
  );
}

export async function saveWidgetSnapshot(
  snapshot: Sub2ApiWidgetSnapshot
): Promise<void> {
  await AsyncStorage.setItem(
    SUB2API_WIDGET_STORAGE_KEY,
    JSON.stringify(snapshot)
  );
}

export async function loadWidgetSnapshot(): Promise<Sub2ApiWidgetSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(SUB2API_WIDGET_STORAGE_KEY);
    if (!raw) return EMPTY_WIDGET_SNAPSHOT;
    const parsed: unknown = JSON.parse(raw);
    return isSnapshot(parsed)
      ? { ...EMPTY_WIDGET_SNAPSHOT, ...parsed, schemaVersion: 2 }
      : EMPTY_WIDGET_SNAPSHOT;
  } catch {
    return EMPTY_WIDGET_SNAPSHOT;
  }
}

export function compactMetric(value: number): string {
  if (!Number.isFinite(value)) return '--';
  try {
    return new Intl.NumberFormat('zh-CN', {
      notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
      maximumFractionDigits: Math.abs(value) >= 10000 ? 1 : 0,
    }).format(value);
  } catch {
    const absolute = Math.abs(value);
    if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (absolute >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(Math.round(value));
  }
}

export function costMetric(value: number): string {
  if (!Number.isFinite(value)) return '--';
  return `$${value.toFixed(2)}`;
}

export function balanceMetric(value: number | null): string {
  return value === null ? '--' : `$${value.toFixed(2)}`;
}

export function relativeSyncLabel(updatedAt: string): string {
  if (!updatedAt) return '等待首次同步';
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return '等待首次同步';
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return '刚刚同步';
  if (minutes < 60) return `${minutes} 分钟前同步`;
  const hours = Math.round(minutes / 60);
  return `${hours} 小时前同步`;
}

/**
 * A widget snapshot is a cache, not a live connection indicator. Treat data
 * older than the launcher refresh window as cached so the UI never claims the
 * server is online merely because an old snapshot exists.
 */
export function isWidgetSnapshotFresh(
  updatedAt: string,
  maxAgeMs = 30 * 60 * 1000
): boolean {
  if (!updatedAt) return false;
  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) && Date.now() - timestamp <= maxAgeMs;
}
