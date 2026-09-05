/**
 * Public ownership and distribution metadata for this build.
 *
 * Keep these values in one place so the About page, GitHub Actions helpers,
 * in-app updater, and release documentation cannot drift apart when the
 * project is forked again.
 */
export const APP_REPOSITORY = 'dude1wudv/sub2api-mate';
export const APP_REPOSITORY_URL = `https://github.com/${APP_REPOSITORY}`;
export const APP_RELEASES_URL = `${APP_REPOSITORY_URL}/releases`;
export const APP_AUTHOR = 'dude1wudv';
export const APP_AUTHOR_LABEL = 'dude1wudv contributors';
export const APP_UPDATE_SOURCE = 'GitHub Releases';
export const APP_NATIVE_BUILD_WORKFLOW = 'android-native-build.yml';
export const APP_RELEASE_WORKFLOW = 'android-release.yml';

export const LEGACY_APP_REPOSITORIES = [
  'trilogys/sub2api-mobile',
  'trilogys/sub2api-mate',
] as const;
