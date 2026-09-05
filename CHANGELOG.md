# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source baseline documentation:
  - `README.md` expanded for setup, architecture, release, and security notes
  - `LICENSE` (MIT)
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `CHANGELOG.md`
- New admin creation flows:
  - `app/users/create-user.tsx` for creating users via `/api/v1/admin/users`
  - `app/accounts/create.tsx` for creating accounts via `/api/v1/admin/accounts`
- New users tab quick action to open the create-user screen.

### Changed

- Repository naming aligned to `sub2api-mobile` in public docs.
- Request URL composition in `src/lib/admin-fetch.ts` now handles duplicated `/api`/`/api/v1` prefixes safely.
- Better admin request error handling for invalid server responses.
- Server settings screen removed the "current compatible sub2api version" display block.

## [1.5.0] - 2026-09-05

### Added

- Responsive Android home-screen dashboard widget with micro, compact, standard,
  and expanded layouts for narrow launchers and large cards.
- GitHub Release workflow that builds signed arm64, armeabi-v7a, and x86_64 APKs,
  generates SHA-256 files, and publishes them to the fork's Releases page.
- Honor MagicOS 11 manifest compatibility plugin for AppWidget broadcasts.

### Changed

- Repository, author, About page, GitHub Actions, and update links now default to
  `dude1wudv/sub2api-mate`.
- GitHub Releases are the default APK update channel; the old Expo project is no
  longer embedded in the build.
