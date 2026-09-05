import 'expo-router/entry';

import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widgets/widget-task-handler';

// Expo Router registers the main application entry above. The widget task is
// registered in the same process so Android can render the headless widget
// surface when the launcher asks for an update.
registerWidgetTaskHandler(widgetTaskHandler);
