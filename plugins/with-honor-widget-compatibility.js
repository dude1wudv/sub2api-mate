const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * The widget library intentionally keeps its AppWidgetProvider receiver
 * non-exported. A few Android 11 based launchers (including MagicOS 11) send
 * the system widget broadcasts from the launcher process and require an
 * exported provider. Keep the receiver scoped to AppWidget actions and only
 * relax this one manifest flag.
 */
module.exports = function withHonorWidgetCompatibility(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    const receivers = application?.receiver ?? [];

    receivers
      .filter((receiver) => String(receiver.$?.['android:name'] ?? '').endsWith('.widget.Sub2ApiDashboard'))
      .forEach((receiver) => {
        receiver.$['android:exported'] = 'true';
        receiver.$['android:enabled'] = 'true';
      });

    return manifestConfig;
  });
};
