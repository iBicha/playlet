<!-- markdownlint-disable MD036 -->

# Releasing

These are mostly the steps when releasing a new version:

## Playlet lib

- Create local branch `release/$VERSION` e.g. `release/0.10.0`
- Set version in package.json
- Update CHANGELOG.md section from `[Unreleased]` to `[$VERSION] - DATE`
- `npm run build:release`
  - This should fail because there are uncommitted changes. This is expected.
- Commit changes
- Create pull request
  - Title: `Release v$VERSION`
  - Comment: `Release $VERSION \nIt should contain everything planned from #6`
- Wait for CI and merge
- Wait for CI on main branch to create the `unstable` release
- Edit `unstable` release
  - Tag: `v$VERSION`
  - Title: `v$VERSION`
  - Body: the content from CHANGELOG.md for this version
  - Uncheck `Set as a pre-release`
  - Check `Set as the latest release`
  - Click `update release`
- Update [Roadmap](https://github.com/iBicha/playlet/issues/6)
  - If current versions says `Planned for $VERSION`, change it to `Released in $VERSION`
  - Add a `Planned for $VERSION` for the next version

**The newest Playlet lib is now LIVE**

## Playlet

For releasing to the store (when needed), this is done following a Playlet lib release:

- Switch to main branch and pull changes - **match commit corresponding to the release.**
- `npm run build:release`
  - This should create the signed package under `release/playlet.pkg`
- Upload to dashboard, and schedule a release (takes a couple of days)
