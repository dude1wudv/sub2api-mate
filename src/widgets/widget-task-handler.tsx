import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { Sub2ApiDashboardWidget } from './Sub2ApiDashboardWidget';
import {
  EMPTY_WIDGET_SNAPSHOT,
  loadWidgetSnapshot,
  SUB2API_WIDGET_NAME,
} from './widget-data';

/**
 * Headless entrypoint used by Android's AppWidgetProvider.
 *
 * Only a sanitized metrics snapshot is read here. Admin keys, passwords and
 * server responses are never persisted for the widget process.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== SUB2API_WIDGET_NAME) return;

  const snapshot = await loadWidgetSnapshot();
  const widget = {
    light: <Sub2ApiDashboardWidget snapshot={snapshot} widgetInfo={props.widgetInfo} />,
    dark: <Sub2ApiDashboardWidget snapshot={snapshot} dark widgetInfo={props.widgetInfo} />,
  };

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK':
      props.renderWidget(widget);
      break;
    case 'WIDGET_DELETED':
      // The launcher removed the widget. Keep the cached snapshot so adding a
      // new widget later can show the last known state immediately.
      break;
    default:
      props.renderWidget({
        light: <Sub2ApiDashboardWidget snapshot={EMPTY_WIDGET_SNAPSHOT} widgetInfo={props.widgetInfo} />,
        dark: <Sub2ApiDashboardWidget snapshot={EMPTY_WIDGET_SNAPSHOT} dark widgetInfo={props.widgetInfo} />,
      });
  }
}
