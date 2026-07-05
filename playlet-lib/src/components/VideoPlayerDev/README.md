# VideoPlayerDev

The custom video player intended to replace `components/VideoPlayer` — a stock-OS-trickplay replica plus a
control button row. It is selected at **compile time** by `#const USE_DEV_PLAYER` in `VideoQueue.bs` (default
`false`). Build with the flag `true` to run it (and the integration suite).

## Architecture

A thin coordinator over a pure-logic brain and projection-only renderers:

- **`VideoPlayerDev.{bs,xml}`** — coordinator. `extends Video`, `enableUI=false` (the OS draws no chrome). Owns
  the focused Video node, key router, Chrome-group fade, PiP resize, and lifecycle plumbing (content load,
  error/retry, SponsorBlock, watch-tracking, cast/Lounge). Holds no transport logic.
- **`TransportController.bs`** — the transport brain: a plain `.bs` class in `m.transport` (not a node). All
  finite state is an int enum. Pull-based — the coordinator forwards device signals, drains
  `TakeVideoIntent`/`TakeTimerCmd`, then pushes the brain's scalar outputs onto the renderers (`ApplyTransport`).
  The LIVE edge is clock-anchored: the coordinator computes it from the wall clock against the manifest's
  `availabilityStartTime` (Playlet generates the manifest) and feeds `OnLiveEdge` on a 1s heartbeat, so it
  advances through pauses/rebuffers/startup; `atLiveEdge` is a pure derivation (offset ≤ jitter band) over the
  learned inherent latency (the smallest edge−position gap observed) — no fall-behind heuristics.
- **`PlayerCoordinatorLogic.bs`** — pure main-thread decisions (key→command, OK action, buffering gate, focus
  nav, storyboard normalize).
- **`SponsorBlockController.bs`** (class) / **`ErrorDialogController.bs`** (namespace functions) — SponsorBlock
  and error logic; the coordinator owns the node-scoped pieces (job callbacks, the dialog node).
- **Renderers** (`TrickPlayBar/`, `BifDisplay/`, `LargePause/`, `LoadBufferSpinner/`, `ButtonRow/`,
  `VideoPlayerButton/`) — SceneGraph components that are pure projections of scalar input fields.
  Each self-derives its own visibility from `transportMode` (a commit sets `transportMode=idle` and the bif
  hides itself, with no external hide call). The title/metadata labels and the shared `Clock` component live
  directly in a Group under Chrome (the clock self-ticks once a minute — no coordinator plumbing).

## Testing

| Layer | Where | Run with |
|-------|-------|----------|
| Unit — logic | `source/tests/VideoPlayerDev/*.spec.bs` | `npm run test:lib` |
| Unit — renderers | `components/VideoPlayerDev/**/*.spec.bs` | `npm run test:lib` |
| Seam (real coordinator, faked device) | `components/VideoPlayerDev/tests/VideoPlayerDevSeam.spec.bs` | `npm run test:lib` |
| Integration (on device) | `integration-tests/vpd-player-*.ts` | `npm run test:integration:player [-- filter]` |

The integration suite asserts `#VideoPlayer` is a `VideoPlayerDev`, so it only passes when the lib is built
with `#const USE_DEV_PLAYER = true`. Filter to a subset, e.g. `npm run test:integration:player -- transport live`.

## State coverage (keeping contradictory states impossible)

The player is kept regression-proof by a two-tier invariant net. Each invariant is a predicate that must ALWAYS
hold; **adding a behavior means adding its invariant + a transition test**, so coverage stays near-complete.

**INV-B\* (brain)** — pure predicates over `TransportController` output, enforced by `PlayerInvariants.CheckBrain`
(`source/tests/VideoPlayerDev/PlayerInvariants.bs` — test-only, excluded from the prod lib) after every step of
the exhaustive + seeded-fuzz suite (`TransportControllerCompleteness.spec.bs`). A meta-test pins this catalog to
`PlayerInvariants.BrainIds()` so it can't drift.

| INV-B | predicate |
|-------|-----------|
| B1 | `cursorMs` within `[0, hi]` (hi = live edge or duration) |
| B3 | `liveOffsetMs ≥ 0` |
| B4 | glyph legal for the current mode |
| B5 | `scanDir ∈ {-1,0,1}`; `scanLevel ∈ [0,3]`; `scanLevel ≥ 1 ⟹ scan/liveDvr` |
| B6 | scrub and scan scratch never both set |
| B8 | `scrubHeldDir ∈ {-1,0,1}` |

(`seekSettling ⟹ a newly-entered transport defers its freeze-pause` is a *transition* property, not a snapshot
predicate, so it is not in this catalog — it is enforced by `FreezeForTransport` and tested at the seam as
P-seam, `VideoPlayerDevSeam.spec.bs`.)

Back is a ladder, also a transition property (not an INV-B snapshot predicate, since it rides `ChromeMode` —
a coordinator field, not a brain one): a transport active cancels it and keeps watching (on live the cancel
also resumes at the frozen playhead — idle-paused live has no OK-resume and cannot hold near the DVR floor
anyway; VOD stays paused, the settled cancel/commit asymmetry); else idle with the chrome up dismisses it
(the same animated fade auto-hide uses); else a chrome still mid fade-out consumes the press and lets the
fade finish (a visible chrome never exits); else nothing is left to dismiss and Back closes. Tested at the
seam, `VideoPlayerDevSeam.spec.bs` ("Back ladder").

**INV-D\* (device-seam)** — need the live `Video.state` (no brain field for it), so checked on-device by
`assertPlayerInvariants()` after every input (`pressChecked`) in the integration harness:

- **INV-D1 — a transport active ⟹ `Video.state ≠ "playing"`** (a transport freezes the video). *The motivating
  bug class.* Prevented structurally: a transport entered while a keep-playing seek is still settling defers its
  freeze-pause rather than pausing mid-seek (which wedged the device buffering↔paused near EOF); the
  `OnVideoState`/`OnPosition` self-heal (`EnforceTransportFreeze`) re-pauses any stray play-under-transport.
  One carve-out: VOD playing at the very end while the cursor is also at the end **finishes** instead
  (`SafetyAction.FinishEof`) — the device refuses to stay paused at EOF, so the freeze would loop forever, and a
  commit there means "watched to the end" anyway (the brain's `finishSeq` does the same for an at-end commit).
  Permanent repro: `integration-tests/vpd-player-sbskip.ts`.
- INV-D2 — bif visible ⟺ a transport is active (the keystone oracle).
- INV-D3 — button row visible ⟺ idle. INV-D4/D5 — focus visuals only while idle and chrome is up.

## SponsorBlock manual skip

The "Press OK to skip" notice outranks the focus tiers: while it is armed, OK skips no matter which tier holds
focus (the screen says so), and Back dismisses the notice instead of acting on the player — it re-arms only
after the position leaves the segment. A skip confirmed while paused stays paused (the coordinator re-pauses on
the playing edge; the device auto-resumes on any seek).

## Lounge takeover

A transport freezes the video, so an external resume from the linked phone (Lounge sets `control=resume` on the
player) is caught in `OnControlChange` and takes over: cancel the transport, hide the bif/chrome, and play from
the phone-seeked position. VPD itself only ever resumes at idle, so a resume under a transport is unambiguously
external.
