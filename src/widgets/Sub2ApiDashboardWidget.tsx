/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  FlexWidget,
  TextWidget,
  type ColorProp,
  type WidgetInfo,
} from 'react-native-android-widget';

import {
  balanceMetric,
  compactMetric,
  costMetric,
  isWidgetSnapshotFresh,
  relativeSyncLabel,
  type Sub2ApiWidgetSnapshot,
} from './widget-data';

const URI = 'sub2apimobile://monitor';

export type WidgetLayout = 'micro' | 'compact' | 'standard' | 'expanded';

interface Sub2ApiDashboardWidgetProps {
  snapshot: Sub2ApiWidgetSnapshot;
  dark?: boolean;
  /**
   * The launcher reports the current size in dp. Passing it through lets the
   * widget use a dense two-column layout when MagicOS gives it a narrow slot,
   * while still showing the full dashboard on a larger home-screen card.
   */
  widgetInfo?: Pick<WidgetInfo, 'width' | 'height'>;
}

interface Palette {
  background: ColorProp;
  backgroundAlt: ColorProp;
  surface: ColorProp;
  border: ColorProp;
  primary: ColorProp;
  text: ColorProp;
  muted: ColorProp;
  success: ColorProp;
  warning: ColorProp;
}

interface Metric {
  label: string;
  value: string;
  accent?: ColorProp;
}

/**
 * Android's AppWidgetManager exposes the requested size in dp. The exact
 * number varies between launchers and font scales, so use conservative
 * breakpoints and keep every row weight-based instead of relying on a fixed
 * pixel width.
 */
export function getWidgetLayout(width = 320, height = 180): WidgetLayout {
  if (width < 210 || height < 116) return 'micro';
  if (width < 270 || height < 142) return 'compact';
  if (width < 340 || height < 176) return 'standard';
  return 'expanded';
}

function paletteFor(dark: boolean): Palette {
  return dark
    ? {
        background: '#0A1220',
        backgroundAlt: '#111E32',
        surface: '#131F33',
        border: '#2A3C5C',
        primary: '#8BB7FF',
        text: '#F5F8FF',
        muted: '#AAB8CF',
        success: '#7BE0B0',
        warning: '#FFD18A',
      }
    : {
        background: '#F3F7FD',
        backgroundAlt: '#EAF2FF',
        surface: '#FFFFFF',
        border: '#D9E4F3',
        primary: '#2F6DF6',
        text: '#152039',
        muted: '#66758C',
        success: '#16835A',
        warning: '#B36B00',
      };
}

function roleLabel(role: Sub2ApiWidgetSnapshot['role']) {
  if (role === 'admin') return '管理员';
  if (role === 'user') return '用户';
  return '只读预览';
}

function statusFor(snapshot: Sub2ApiWidgetSnapshot, palette: Palette): {
  label: string;
  color: ColorProp;
  background: ColorProp;
} {
  const hasSnapshot = Boolean(snapshot.updatedAt);
  const fresh = hasSnapshot && isWidgetSnapshotFresh(snapshot.updatedAt);
  return {
    label: !hasSnapshot ? '未同步' : fresh ? '已同步' : '缓存',
    color: fresh ? palette.success : palette.warning,
    background: fresh ? 'rgba(22, 131, 90, 0.16)' : 'rgba(179, 107, 0, 0.16)',
  };
}

function metricsFor(
  snapshot: Sub2ApiWidgetSnapshot,
  layout: WidgetLayout,
): Metric[] {
  const accountHealth = `${compactMetric(snapshot.normalAccounts)}/${compactMetric(snapshot.totalAccounts)}`;
  const keyHealth = `${compactMetric(snapshot.activeApiKeys)}/${compactMetric(snapshot.totalApiKeys)}`;

  if (layout === 'micro') {
    return [
      { label: '请求', value: compactMetric(snapshot.todayRequests) },
      { label: 'Token', value: compactMetric(snapshot.todayTokens) },
      { label: '成本', value: costMetric(snapshot.todayCost) },
    ];
  }

  if (layout === 'compact') {
    return [
      { label: '今日请求', value: compactMetric(snapshot.todayRequests) },
      { label: '今日 Token', value: compactMetric(snapshot.todayTokens) },
      { label: '今日成本', value: costMetric(snapshot.todayCost) },
      snapshot.role === 'admin'
        ? { label: '账号健康', value: accountHealth, accent: snapshot.errorAccounts ? '#B36B00' : '#16835A' }
        : { label: '账户余额', value: balanceMetric(snapshot.balance) },
    ];
  }

  if (layout === 'standard') {
    return [
      { label: '今日请求', value: compactMetric(snapshot.todayRequests) },
      { label: '今日 Token', value: compactMetric(snapshot.todayTokens) },
      { label: '今日成本', value: costMetric(snapshot.todayCost) },
      {
        label: snapshot.role === 'admin' ? '异常账号' : '账户余额',
        value: snapshot.role === 'admin'
          ? `${compactMetric(snapshot.errorAccounts)}/${compactMetric(snapshot.totalAccounts)}`
          : balanceMetric(snapshot.balance),
        accent: snapshot.role === 'admin' && snapshot.errorAccounts ? '#B36B00' : undefined,
      },
    ];
  }

  return [
    { label: '今日请求', value: compactMetric(snapshot.todayRequests) },
    { label: '今日 Token', value: compactMetric(snapshot.todayTokens) },
    { label: '今日成本', value: costMetric(snapshot.todayCost) },
    { label: '累计请求', value: compactMetric(snapshot.totalRequests) },
    {
      label: snapshot.role === 'admin' ? '账号健康' : '账户余额',
      value: snapshot.role === 'admin' ? accountHealth : balanceMetric(snapshot.balance),
      accent: snapshot.role === 'admin' && snapshot.errorAccounts ? '#B36B00' : undefined,
    },
    { label: snapshot.role === 'admin' ? '活跃 Key' : '活跃用户', value: snapshot.role === 'admin' ? keyHealth : compactMetric(snapshot.activeUsers) },
  ];
}

export function Sub2ApiDashboardWidget({
  snapshot,
  dark = false,
  widgetInfo,
}: Sub2ApiDashboardWidgetProps) {
  const palette = paletteFor(dark);
  const layout = getWidgetLayout(widgetInfo?.width, widgetInfo?.height);
  const status = statusFor(snapshot, palette);
  const micro = layout === 'micro';
  const compact = micro || layout === 'compact';
  const columns = layout === 'expanded' ? 3 : 2;
  const metrics = metricsFor(snapshot, layout);
  const role = roleLabel(snapshot.role);
  const padding = micro ? 7 : compact ? 9 : 11;
  const gap = micro ? 4 : compact ? 5 : 7;

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        padding,
        borderRadius: micro ? 16 : 22,
        backgroundGradient: {
          from: palette.background,
          to: palette.backgroundAlt,
          orientation: 'TL_BR',
        },
        flexDirection: 'column',
        flexGap: gap,
        overflow: 'hidden',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: URI }}
      accessibilityLabel="打开 Sub2API 看板"
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <FlexWidget
          style={{
            width: 0,
            flex: 1,
            flexDirection: 'column',
          }}
        >
          <TextWidget
            text={micro ? 'Sub2API' : 'Sub2API 看板'}
            style={{
              width: 'match_parent',
              fontSize: micro ? 14 : compact ? 16 : 17,
              fontWeight: '800',
              color: palette.text,
              letterSpacing: -0.2,
              adjustsFontSizeToFit: true,
            }}
            maxLines={1}
            truncate="END"
            allowFontScaling={false}
          />
          {!micro ? (
            <TextWidget
              text={`${snapshot.serverLabel} · ${role}`}
              style={{
                width: 'match_parent',
                marginTop: 2,
                fontSize: compact ? 9 : 10,
                color: palette.muted,
                adjustsFontSizeToFit: true,
              }}
              maxLines={1}
              truncate="MIDDLE"
              allowFontScaling={false}
            />
          ) : null}
        </FlexWidget>
        <TextWidget
          text={`● ${status.label}`}
          style={{
            width: 'wrap_content',
            marginLeft: 6,
            paddingHorizontal: micro ? 5 : 7,
            paddingVertical: micro ? 3 : 4,
            borderRadius: 999,
            backgroundColor: status.background,
            fontSize: micro ? 8 : 9,
            fontWeight: '700',
            color: status.color,
            adjustsFontSizeToFit: true,
          }}
          maxLines={1}
          allowFontScaling={false}
        />
      </FlexWidget>

      <MetricGrid
        metrics={metrics}
        columns={columns}
        palette={palette}
        layout={layout}
        gap={gap}
      />

      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <FlexWidget style={{ width: 0, flex: 1 }}>
          <TextWidget
            text={`RPM ${compactMetric(snapshot.rpm)} · TPM ${compactMetric(snapshot.tpm)}`}
            style={{
              width: 'match_parent',
              fontSize: micro ? 8 : 9,
              fontWeight: '700',
              color: palette.primary,
              adjustsFontSizeToFit: true,
            }}
            maxLines={1}
            truncate="END"
            allowFontScaling={false}
          />
        </FlexWidget>
        {!micro ? (
          <FlexWidget style={{ width: 0, flex: 1, marginLeft: 6 }}>
            <TextWidget
              text={snapshot.role === 'admin' ? `用户 ${compactMetric(snapshot.activeUsers)} · 异常 ${compactMetric(snapshot.errorAccounts)}` : `累计 ${compactMetric(snapshot.totalRequests)} 请求`}
              style={{
                width: 'match_parent',
                fontSize: 9,
                color: snapshot.role === 'admin' && snapshot.errorAccounts > 0 ? palette.warning : palette.muted,
                fontWeight: '600',
                textAlign: 'right',
                adjustsFontSizeToFit: true,
              }}
              maxLines={1}
              truncate="END"
              allowFontScaling={false}
            />
          </FlexWidget>
        ) : null}
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          paddingTop: micro ? 3 : 5,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <FlexWidget style={{ width: 0, flex: 1 }}>
          <TextWidget
            text={micro ? '点击查看详情' : '点击打开完整监控'}
            style={{
              width: 'match_parent',
              fontSize: micro ? 8 : 9,
              color: palette.muted,
              adjustsFontSizeToFit: true,
            }}
            maxLines={1}
            truncate="END"
            allowFontScaling={false}
          />
        </FlexWidget>
        <FlexWidget style={{ width: 0, flex: 1, marginLeft: 6 }}>
          <TextWidget
            text={relativeSyncLabel(snapshot.updatedAt)}
            style={{
              width: 'match_parent',
              fontSize: micro ? 8 : 9,
              color: palette.muted,
              textAlign: 'right',
              adjustsFontSizeToFit: true,
            }}
            maxLines={1}
            truncate="END"
            allowFontScaling={false}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

function MetricGrid({
  metrics,
  columns,
  palette,
  layout,
  gap,
}: {
  metrics: Metric[];
  columns: number;
  palette: Palette;
  layout: WidgetLayout;
  gap: number;
}) {
  const rows: Metric[][] = [];
  for (let index = 0; index < metrics.length; index += columns) {
    rows.push(metrics.slice(index, index + columns));
  }

  const cardHeight = layout === 'micro' ? 30 : layout === 'compact' ? 35 : layout === 'standard' ? 38 : 40;

  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'column', flexGap: gap }}>
      {rows.map((row, rowIndex) => (
        <FlexWidget key={`metric-row-${rowIndex}`} style={{ width: 'match_parent', flexDirection: 'row', flexGap: gap }}>
          {row.map((metric) => (
            <MetricCard key={metric.label} metric={metric} palette={palette} height={cardHeight} />
          ))}
          {Array.from({ length: columns - row.length }, (_, index) => (
            <FlexWidget key={`metric-spacer-${rowIndex}-${index}`} style={{ width: 0, flex: 1 }} />
          ))}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

function MetricCard({
  metric,
  palette,
  height,
}: {
  metric: Metric;
  palette: Palette;
  height: number;
}) {
  return (
    <FlexWidget
      style={{
        width: 0,
        flex: 1,
        height,
        paddingHorizontal: 7,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        flexDirection: 'column',
      }}
    >
      <TextWidget
        text={metric.label}
        style={{
          width: 'match_parent',
          fontSize: 8,
          color: palette.muted,
          fontWeight: '600',
          adjustsFontSizeToFit: true,
        }}
        maxLines={1}
        truncate="END"
        allowFontScaling={false}
      />
      <TextWidget
        text={metric.value}
        style={{
          width: 'match_parent',
          marginTop: 2,
          fontSize: height <= 30 ? 13 : 15,
          fontWeight: '800',
          color: metric.accent ?? palette.text,
          adjustsFontSizeToFit: true,
        }}
        maxLines={1}
        truncate="END"
        allowFontScaling={false}
      />
    </FlexWidget>
  );
}
