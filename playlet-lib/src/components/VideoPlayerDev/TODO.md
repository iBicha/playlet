# VideoPlayerDev TODO

## Quality Button - Focus Restoration Issue

**Status:** Disabled (button is greyed out)

### Problem
When the Quality button is pressed from the VideoPlayerDev player UI, it opens a QualitySelector screen via `AppController.PushScreen()`. When the QualitySelector is closed (via Save, Back, or Close button), focus does not return to the VideoPlayerDev, causing the player bar to become unresponsive.

### Root Cause
The VideoPlayerDev is NOT on the AppController's screen stack - it lives in the VideoContainer. When `PopScreen()` is called, `FocusTopScreen()` focuses the top screen on the stack (AppRoot), not the VideoPlayerDev. This is by design for normal screen navigation but breaks for modal dialogs opened from the player.

### What Was Tried

1. **Timer-based parent checking**: Created a repeating timer to check when the QualitySelector's parent becomes invalid (removed from scene). The timer callback was never firing, possibly due to how Roku handles timers on dynamically created nodes.

2. **focusedChild observer**: Observed the QualitySelector's `focusedChild` field to detect when it loses focus, then used a small delay timer to check if it was actually removed. The focus change was detected but the follow-up timer didn't restore focus properly.

3. **Focus restoration with UI state change**: Tried calling `NodeSetFocus(m.top, true)`, `NodeSetFocus(m.playButton, true)`, and `m.top.playerUiState = PlayerUiState.FadingIn` to restore both focus and UI visibility. This didn't work reliably.

### Potential Solutions to Explore

1. **Don't use PushScreen**: Instead of pushing QualitySelector as a screen, add it as a child of the VideoPlayerDev itself. This would keep focus within the player's node tree but requires different handling for the selector's layout and navigation.

2. **Custom PopScreen with callback**: Modify AppController to support a callback when popping a screen, allowing the caller to restore focus explicitly.

3. **VideoQueue-level handling**: Have VideoQueue observe when screens are popped and restore focus to the player if it's in fullscreen mode.

4. **Use a different UI pattern**: Instead of a full screen selector, use an overlay/popup that doesn't require pushing to the screen stack.

### Working Features

The following player UI features are working:
- Play/Pause button
- Skip back/forward (10 seconds) buttons
- Previous/Next video buttons
- CC (Closed Captions) toggle
- Bookmark add/remove
- PIP (Picture-in-Picture) minimize
- Remote rewind/fast-forward buttons for 10-second skip

### Files Involved

- `playlet-lib/src/components/VideoPlayerDev/VideoPlayerDev.bs` - Main player logic
- `playlet-lib/src/components/AppController/AppController.bs` - Screen stack management
- `playlet-lib/src/components/Screens/SettingsScreen/QualitySelector/QualitySelector.bs` - Quality selector component
