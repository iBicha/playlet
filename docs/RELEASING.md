<!-- markdownlint-disable MD036 -->

# Releasing

The release process for Playlet is very simple, since most of the work is automated.
The automation makes `canary` releases.

```makefile
canary release + QA = stable version
```

These are mostly the steps when releasing a new version:

## Playlet lib

- Use the [Release trigger](https://github.com/iBicha/playlet/actions/workflows/release-trigger.yml) to trigger a release
  - Run workflow from **main** branch
  - Set the new version in the format X.Y.Z
- Wait for the PR to be created
- Inspect PR, wait for CI and merge
- Wait for CI on main branch to create the `canary` release
- Edit [`canary`](https://github.com/iBicha/playlet/releases/tag/canary) release
  - Tag: `v$VERSION`
  - Title: `v$VERSION`
  - Body: the content from CHANGELOG.md for this version
    - This should be already included, just remove the notes about testing the canary release
  - Uncheck `Set as a pre-release`
  - Check `Set as the latest release`
  - Click `update release`
- Update [Roadmap](https://github.com/iBicha/playlet/issues/6)
  - If current versions says `Planned for $VERSION`, change it to `Released in $VERSION`
  - Add a `Planned for $VERSION` for the next version

**The newest Playlet lib is now LIVE**

## Playlet

For releasing to the store (when needed), signed packages are attached to Github releases, ready to publish
