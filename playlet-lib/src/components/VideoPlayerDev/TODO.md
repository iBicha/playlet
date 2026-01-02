# VideoPlayerDev TODO

## Quality Button - Focus Restoration Issue

**Status:** Resolved (using cycle-through approach)

### Original Problem
When the Quality button was pressed from the VideoPlayerDev player UI, it opened a QualitySelector screen via `AppController.PushScreen()`. When the QualitySelector was closed, focus did not return to the VideoPlayerDev, causing the player bar to become unresponsive.

### Solution Implemented
Instead of opening a popup dialog, the Quality button now cycles through the available quality options on each press:
- Auto → 1080p → 720p → 480p → 360p → 240p → 144p → Auto (loops)

This avoids the focus management issues entirely while still providing quick access to quality settings.

### Working Features

The following player UI features are working:
- Play/Pause button
- Skip back/forward (10 seconds) buttons
- Previous/Next video buttons
- **Quality toggle** (cycles through options)
- CC (Closed Captions) toggle
- Bookmark add/remove
- PIP (Picture-in-Picture) minimize
- Remote rewind/fast-forward buttons for 10-second skip

### Files Involved

- `playlet-lib/src/components/VideoPlayerDev/VideoPlayerDev.bs` - Main player logic
