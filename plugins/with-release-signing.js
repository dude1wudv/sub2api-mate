const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Keep release signing configurable without committing a private keystore.
 * GitHub Actions writes the four MYAPP_UPLOAD_* Gradle properties from
 * repository secrets; local builds continue to use the debug key when those
 * properties are absent.
 */
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (buildGradleConfig) => {
    let contents = buildGradleConfig.modResults.contents;
    if (contents.includes('MYAPP_UPLOAD_STORE_FILE')) return buildGradleConfig;

    const debugSigning = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }`;

    const signingStart = contents.indexOf('    signingConfigs {');
    const buildTypesStart = contents.indexOf('    buildTypes {', signingStart);
    if (signingStart >= 0 && buildTypesStart > signingStart) {
      contents = `${contents.slice(0, signingStart)}${debugSigning}\n${contents.slice(buildTypesStart)}`;
    }

    const buildTypesIndex = contents.indexOf('    buildTypes {');
    if (buildTypesIndex >= 0) {
      const beforeBuildTypes = contents.slice(0, buildTypesIndex);
      const buildTypes = contents.slice(buildTypesIndex).replace(
        /release \{([\s\S]*?)signingConfig signingConfigs\.debug/,
        "release {$1signingConfig project.hasProperty('MYAPP_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
      );
      contents = `${beforeBuildTypes}${buildTypes}`;
    }

    buildGradleConfig.modResults.contents = contents;
    return buildGradleConfig;
  });
};
