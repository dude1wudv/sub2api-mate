import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { Sub2ApiDashboardWidget } from './Sub2ApiDashboardWidget';
import {
  loadWidgetSnapshot,
  SUB2API_WIDGET_NAME,
  type Sub2ApiWidgetSnapshot,
} from './widget-data';

/**
 * Push the latest local snapshot to any dashboard widgets on the launcher.
 *
 * The native module is unavailable in Expo Go, so callers should treat this
 * as best-effort and ignore the rejected promise during development.
 */
export async function requestSub2ApiWidgetUpdate(
  snapshot?: Sub2ApiWidgetSnapshot
): Promise<void> {
  if (Platform.OS !== 'android') return;

  const current = snapshot ?? (await loadWidgetSnapshot());

  try {
    await requestWidgetUpdate({
      widgetName: SUB2API_WIDGET_NAME,
      renderWidget: (widgetInfo) => ({
        light: <Sub2ApiDashboardWidget snapshot={current} widgetInfo={widgetInfo} />,
        dark: <Sub2ApiDashboardWidget snapshot={current} dark widgetInfo={widgetInfo} />,
      }),
    });
  } catch {
    // Expo Go and an older installed APK do not expose the native module. The
    // next native build will pick up the persisted snapshot automatically.
  }
}
