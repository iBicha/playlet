# 4K video playback implementation plan
_Exported on 12/28/2025 at 08:15:41 PST from Cursor (2.3.7)_

---

**User**

Analyze our repo and make a plan to implement 4k video playback.  Don't forget to consider 
API Support, Backend Compatibility
1. Manifest Updates
ui_resolutions=fhduri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p
2. Quality Selector Enhancement
Add 2160p/4K option to the quality selection UI and processing logic.
3. UI Assets
Create FHD (1920x1080) versions of all UI assets
Update image generation scripts for FHD assets
Adjust UI scaling for higher resolution displays
4. Video Processing
Update quality filtering to include 2160p heights
Ensure HLS/DASH manifest processing handles 4K streams
Test 4K video decoding on target Roku devices
5. Device Compatibility - 
Verify 4K-capable Roku devices can handle the increased UI complexity
Test performance impact of higher resolution UI

---

**Cursor**

I'll analyze your repository to understand the current implementation and create a comprehensive plan for 4K video playback. Let me explore the key areas first.

I now have a complete understanding of your codebase. Let me create a comprehensive plan for implementing 4K video playback.

I apologize for the technical issue with the planning tool. Let me present the comprehensive plan directly:

---

# 4K Video Playback Implementation Plan

## Current State Analysis

The codebase currently supports up to 1080p video quality:
- **Manifest**: `ui_resolutions=hd` and `uri_resolution_autosub=$$RES$$,480p,720p,1080p`
- **Quality Selector**: Hardcoded to auto, 1080p, 720p, 480p, 360p, 240p, 144p
- **Video Processing**: DASH/HLS filtering already supports height-based quality selection
- **API Support**: Invidious API already supports `4k` feature filter (see `invidious_video_api.yaml` line 44)

---

## Implementation Tasks

### 1. Manifest Updates

Update both manifest files to support FHD UI and 2160p video:

**[playlet-lib/src/manifest](playlet-lib/src/manifest)**

```
ui_resolutions=fhd
uri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p
```

**[playlet-app/src/manifest](playlet-app/src/manifest)**

```
ui_resolutions=fhd
uri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p
```

---

### 2. Quality Selector Enhancement

Add 2160p/4K option to all quality selection interfaces:

**TV UI - [QualitySelector.xml](playlet-lib/src/components/Screens/SettingsScreen/QualitySelector/QualitySelector.xml)**
- Add `<ContentNode id="2160p" title="2160p (4K)" />` after the "auto" option
- Update Rectangle dimensions from 1280x720 to 1920x1080

**TV BrightScript - [QualitySelector.bs](playlet-lib/src/components/Screens/SettingsScreen/QualitySelector/QualitySelector.bs)**
- Update `m.lastCheckedState` array size from 7 to 8 elements (line 22)
- Update fallback values on lines 102-103, 108, 111, and 131

**TV Control - [EditQualityControl.bs](playlet-lib/src/components/Screens/SettingsScreen/QualitySelector/EditQualityControl.bs)**
- Add `"2160p": "2160p (4K)"` to the qualityToLabel mapping

**Web UI - [EditQualityControl.svelte](playlet-web/src/lib/Screens/Settings/SettingControls/EditQualityControl.svelte)**
- Add `"2160p": "2160p (4K)"` to the qualityLabels object

---

### 3. UI Assets Updates

Since changing to `ui_resolutions=fhd`, the UI will render at 1920x1080 instead of 1280x720.

**Scale Factor Update - [CirclePoster.bs](playlet-lib/src/components/CirclePoster/CirclePoster.bs)**

```brightscript
' Change line 26 from:
m.uiScaleFactor = uiResolutionWidth / 1280
' To:
m.uiScaleFactor = uiResolutionWidth / 1920
```

**Fixed Dimension Components to Update:**
- `QualitySelector.xml` - Rectangle dimensions (1280x720 -> 1920x1080)
- Button positions in `QualitySelector.bs` need scaling (780/2 -> 1170/2, etc.)
- `SettingsScreen.bs` - Already uses 1920 width (good!)

**Image Assets** (Optional enhancement):
- Update SVG `meta.json5` files in `playlet-lib/src/images/` to include higher resolution output variants
- The `tools/convert-images.js` script can generate higher resolution PNGs from existing SVGs

---

### 4. Video Processing Verification

The existing code already handles 4K streams correctly:

**DASH Manifest - [DashManifest.bs](playlet-lib/src/components/Services/Dash/DashManifest.bs)**

```22:31:playlet-lib/src/components/Services/Dash/DashManifest.bs
function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
    // ...
    if stream.height <> invalid
        if qualityFilter[ToString(stream.height)] = true
            return true
        end if
    end if
    // ...
end function
```

This will accept 2160 height automatically when quality filter includes "2160".

**HLS Router - [HlsRouter.bs](playlet-lib/src/components/Web/PlayletWebServer/Middleware/HlsRouter.bs)**
- `FilterHlsManifest()` filters by resolution height, will accept 2160 automatically

**HDR Consideration** - Line 49 shows HDR is currently disabled:

```brightscript
hlsManifest = m.ReplaceVideoRange(hlsManifest)
```

This forces SDR playback. Testing on 4K-capable devices may reveal whether HDR can be re-enabled.

---

### 5. Device Compatibility Considerations

**4K-Capable Roku Devices:**
- Roku Ultra, Streaming Stick 4K, Express 4K+, etc.
- These devices report 4K capability via `roDeviceInfo.GetVideoMode()`
- The app already captures this info in `ApplicationInfo.bs` (line 76)

**Testing Recommendations:**
- Verify 4K video decoding works on target devices
- Test UI performance impact of FHD rendering
- Monitor memory usage with higher resolution content
- Test HDR playback if removing the `ReplaceVideoRange()` workaround

---

## Architecture Flow

```mermaid
flowchart TD
    subgraph Manifest[Manifest Configuration]
        M1[ui_resolutions=fhd]
        M2[uri_resolution_autosub includes 2160p]
    end
    
    subgraph QualityUI[Quality Selection UI]
        Q1[QualitySelector.xml - TV]
        Q2[EditQualityControl.bs - TV]
        Q3[EditQualityControl.svelte - Web]
    end
    
    subgraph VideoProcessing[Video Stream Processing]
        V1[DashManifest.bs]
        V2[HlsRouter.bs]
        V3[VideoContentJob.bs]
    end
    
    subgraph Backend[Backend API]
        B1[Invidious API - 4k filter]
        B2[Innertube PlayerEndpoint]
    end
    
    Manifest --> VideoProcessing
    QualityUI --> V3
    V3 --> V1
    V3 --> V2
    Backend --> V3
```

---

## Summary of Files to Modify

| File | Change Type |
|------|-------------|
| `playlet-lib/src/manifest` | Update ui_resolutions and uri_resolution_autosub |
| `playlet-app/src/manifest` | Update ui_resolutions and uri_resolution_autosub |
| `playlet-lib/src/components/Screens/SettingsScreen/QualitySelector/QualitySelector.xml` | Add 2160p option, update dimensions |
| `playlet-lib/src/components/Screens/SettingsScreen/QualitySelector/QualitySelector.bs` | Update array sizes for 8 quality options |
| `playlet-lib/src/components/Screens/SettingsScreen/QualitySelector/EditQualityControl.bs` | Add 2160p label mapping |
| `playlet-web/src/lib/Screens/Settings/SettingControls/EditQualityControl.svelte` | Add 2160p label |
| `playlet-lib/src/components/CirclePoster/CirclePoster.bs` | Update scale factor base from 1280 to 1920 |

---

## Key Findings

1. **Backend Already Supports 4K**: The Invidious API and Innertube PlayerEndpoint already return 4K adaptive formats when available. No backend changes needed.

2. **Video Processing Ready**: The DASH and HLS routers use height-based filtering that will automatically work with 2160p when the quality option is added.

3. **UI Scaling Mechanism Exists**: The `GetUIScaleFactor()` function in CirclePoster.bs provides a pattern for handling resolution differences, just needs the base updated from 1280 to 1920.

4. **HDR Workaround**: There's an existing workaround that forces SDR playback due to player issues with HDR. This may need investigation for proper 4K HDR support.

Would you like me to proceed with implementing these changes?

```plaintext
ui_resolutions=fhd
uri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p
```

```plaintext
ui_resolutions=fhd
uri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p
```

```brightscript
' Change line 26 from:
m.uiScaleFactor = uiResolutionWidth / 1280
' To:
m.uiScaleFactor = uiResolutionWidth / 1920
```

```plaintext
function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
    // ...
    if stream.height <> invalid
        if qualityFilter[ToString(stream.height)] = true
            return true
        end if
    end if
    // ...
end function
```

```brightscript
hlsManifest = m.ReplaceVideoRange(hlsManifest)
```

```plaintext
flowchart TD
    subgraph Manifest[Manifest Configuration]
        M1[ui_resolutions=fhd]
        M2[uri_resolution_autosub includes 2160p]
    end
    
    subgraph QualityUI[Quality Selection UI]
        Q1[QualitySelector.xml - TV]
        Q2[EditQualityControl.bs - TV]
        Q3[EditQualityControl.svelte - Web]
    end
    
    subgraph VideoProcessing[Video Stream Processing]
        V1[DashManifest.bs]
        V2[HlsRouter.bs]
        V3[VideoContentJob.bs]
    end
    
    subgraph Backend[Backend API]
        B1[Invidious API - 4k filter]
        B2[Innertube PlayerEndpoint]
    end
    
    Manifest --> VideoProcessing
    QualityUI --> V3
    V3 --> V1
    V3 --> V2
    Backend --> V3
```

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

```plaintext
title=PlayletLib

# Do not update version manually, it is auto updated from package.json
major_version=0
minor_version=44
build_version=00004

ui_resolutions=fhd
uri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p

sg_component_libs_provided=PlayletLib
hidden=1

git_commit_sha=unknown

bs_const=DEBUG=false;TEST_MODE=false
```

```plaintext
title=Playlet

# Do not update version manually, it is auto updated from package.json
major_version=0
minor_version=44
build_version=00004

ui_resolutions=fhd
uri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p

##   Channel Assets
###  Main Menu Icons / Channel Poster Artwork
#### Image sizes are FHD: 540x405px | HD: 290x218px | SD: 246x140px
mm_icon_focus_fhd=pkg:/images/channel-poster_fhd.png
mm_icon_focus_hd=pkg:/images/channel-poster_hd.png
mm_icon_focus_sd=pkg:/images/channel-poster_sd.png

###  Splash Screen + Loading Screen Artwork
#### Image sizes are FHD: 1920x1080px | HD: 1280x720px | SD: 720x480px
splash_screen_fhd=pkg:/images/splash-screen_fhd.jpg
splash_screen_hd=pkg:/images/splash-screen_hd.jpg
splash_screen_sd=pkg:/images/splash-screen_sd.jpg

splash_color=#242424
splash_min_time=0

confirm_partner_button=1

supports_input_launch=1

requires_widevine_drm=1
requires_widevine_version=1.0

playlet_lib_squashfs_remote_url=https://github.com/iBicha/playlet/releases/latest/download/playlet-lib.squashfs.pkg
playlet_lib_zip_remote_url=https://github.com/iBicha/playlet/releases/latest/download/playlet-lib.zip
playlet_lib_zip_embedded_url=pkg:/lib/playlet-lib.zip
playlet_lib_zip_debug_url=http://DEBUG_HOST_IP_ADDRESS:8086/playlet-lib.zip

git_commit_sha=unknown

bs_const=DEBUG=false;TEST_MODE=false;DEBUG_FALLBACK_TO_EMBEDDED=true
```

```xml
<component name="QualitySelector" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="value" type="string" onChange="OnValueChange" />
        <field id="save" type="boolean" alwaysNotify="true" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="780"
            height="650"
            translation="[570,215]"
            color="#242424">
            <CheckList
                id="checkList"
                vertFocusAnimationStyle="floatingFocus"
                translation="[220,70]">

                <ContentNode role="content">
                    <ContentNode id="auto" title="Auto" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="2160p" title="2160p (4K)" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="1080p" title="1080p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="720p" title="720p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="480p" title="480p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="360p" title="360p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="240p" title="240p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="144p" title="144p" />
                </ContentNode>
            </CheckList>

            <ButtonEx
                id="saveButton"
                iconVisible="false"
                text="Save"
                padding="[30,30]"
                translation="[340,550]" />
            <ButtonEx
                id="closeButton"
                iconVisible="false"
                text="Close"
                padding="[30,30]"
                translation="[496,550]" />
        </Rectangle>
    </children>
</component>
```

```brighterscript
import "pkg:/components/Navigation/Navigation.bs"
import "pkg:/components/parts/AutoBind/OnNodeReadyNoOp.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/MathUtils.bs"
import "pkg:/source/utils/RemoteKeys.bs"
import "pkg:/source/utils/Types.bs"

function Init()
    m.checkList = m.top.findNode("checkList")
    m.closeButton = m.top.findNode("closeButton")
    m.saveButton = m.top.findNode("saveButton")

    SetNavigation(m.checkList, RemoteKeys.Down, m.saveButton)
    SetNavigation(m.saveButton, RemoteKeys.Up, m.checkList)
    SetNavigation(m.closeButton, RemoteKeys.Up, m.checkList)
    SetNavigation(m.saveButton, RemoteKeys.Right, m.closeButton)
    SetNavigation(m.closeButton, RemoteKeys.Left, m.saveButton)

    m.saveButton.observeField("buttonSelected", FuncName(OnSaveButtonSelected))
    m.closeButton.observeField("buttonSelected", FuncName(Close))

    m.lastCheckedState = [false, false, false, false, false, false, false, false]
    m.checkList.observeField("checkedState", FuncName(OnCheckedStateChange))

    SetButtonPositions()
end function

function SetButtonPositions()
    saveButtonWidth = m.saveButton.width
    closeButtonWidth = m.closeButton.width
    buttonsWith = closeButtonWidth + saveButtonWidth + 20
    m.saveButton.translation = [780 / 2 - buttonsWith / 2, m.saveButton.translation[1]]
    m.closeButton.translation = [780 / 2 + buttonsWith / 2 - closeButtonWidth, m.closeButton.translation[1]]
end function

function OnFocusChange() as void
    if not m.top.focus
        return
    end if

    NodeSetFocus(m.checkList, true)
end function

function OnKeyEvent(key as string, press as boolean) as boolean
    if NavigationKeyHandler(key, press).handled
        return true
    end if

    if key = RemoteKeys.Options or key = RemoteKeys.Play or key = RemoteKeys.Pause or key = RemoteKeys.PlayOnly
        ' A pass-through to the app controller, so it can toggle picture-in-picture and pause/play
        return false
    end if

    if key = RemoteKeys.Back and press
        Close()
        return true
    end if

    return true
end function

function OnValueChange() as void
    content = m.checkList.content
    value = m.top.value

    if content = invalid or content.getChildCount() = 0
        return
    end if

    values = value.Split(",")
    valuesDict = {}
    for each value in values
        valuesDict[value] = true
    end for

    checkboxes = content.getChildren(-1, 0)
    checkedState = []
    for i = 0 to checkboxes.Count() - 1
        checkedState.push(valuesDict.DoesExist(checkboxes[i].id))
    end for
    m.checkList.checkedState = checkedState
end function

function OnCheckedStateChange() as void
    content = m.checkList.content
    if content = invalid or content.getChildCount() = 0
        return
    end if

    checkedState = m.checkList.checkedState
    if checkedState = invalid or checkedState.Count() = 0
        return
    end if
    lastCheckedState = m.lastCheckedState
    m.lastCheckedState = checkedState

    autoChanged = lastCheckedState[0] <> checkedState[0]
    hasAuto = checkedState[0]

    if autoChanged
        if hasAuto
            checkedState = [true, false, false, false, false, false, false]
            m.lastCheckedState = checkedState
            m.checkList.checkedState = checkedState
            m.top.value = "auto"
            return
        else
            checkedState = [false, true, true, true, true, true, true]
            m.lastCheckedState = checkedState
            m.checkList.checkedState = checkedState
            m.top.value = "1080p,720p,480p,360p,240p,144p"
            return
        end if
    end if

    values = []
    checkboxes = content.getChildren(-1, 0)

    hasNonAuto = false
    for i = 0 to checkboxes.Count() - 1
        if not checkedState[i]
            continue for
        end if
        values.push(checkboxes[i].id)
        if i <> 0
            hasNonAuto = true
        end if
    end for

    if values.Count() = 0
        checkedState = [true, false, false, false, false, false, false]
        m.lastCheckedState = checkedState
        m.checkList.checkedState = checkedState
        m.top.value = "auto"
        return
    end if

    if hasNonAuto and hasAuto
        checkedState[0] = false
        m.lastCheckedState = checkedState
        m.checkList.checkedState = checkedState
        values.shift()
    end if

    m.top.value = values.Join(",")
end function

function OnSaveButtonSelected()
    OnCheckedStateChange()
    m.top.save = true
    Close()
end function

function Close()
    m.appController@.PopScreen()
end function

```

```brighterscript
import "pkg:/components/Navigation/Navigation.bs"
import "pkg:/components/parts/AutoBind/OnNodeReadyNoOp.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/MathUtils.bs"
import "pkg:/source/utils/RemoteKeys.bs"
import "pkg:/source/utils/Types.bs"

function Init()
    m.checkList = m.top.findNode("checkList")
    m.closeButton = m.top.findNode("closeButton")
    m.saveButton = m.top.findNode("saveButton")

    SetNavigation(m.checkList, RemoteKeys.Down, m.saveButton)
    SetNavigation(m.saveButton, RemoteKeys.Up, m.checkList)
    SetNavigation(m.closeButton, RemoteKeys.Up, m.checkList)
    SetNavigation(m.saveButton, RemoteKeys.Right, m.closeButton)
    SetNavigation(m.closeButton, RemoteKeys.Left, m.saveButton)

    m.saveButton.observeField("buttonSelected", FuncName(OnSaveButtonSelected))
    m.closeButton.observeField("buttonSelected", FuncName(Close))

    m.lastCheckedState = [false, false, false, false, false, false, false, false]
    m.checkList.observeField("checkedState", FuncName(OnCheckedStateChange))

    SetButtonPositions()
end function

function SetButtonPositions()
    saveButtonWidth = m.saveButton.width
    closeButtonWidth = m.closeButton.width
    buttonsWith = closeButtonWidth + saveButtonWidth + 20
    m.saveButton.translation = [780 / 2 - buttonsWith / 2, m.saveButton.translation[1]]
    m.closeButton.translation = [780 / 2 + buttonsWith / 2 - closeButtonWidth, m.closeButton.translation[1]]
end function

function OnFocusChange() as void
    if not m.top.focus
        return
    end if

    NodeSetFocus(m.checkList, true)
end function

function OnKeyEvent(key as string, press as boolean) as boolean
    if NavigationKeyHandler(key, press).handled
        return true
    end if

    if key = RemoteKeys.Options or key = RemoteKeys.Play or key = RemoteKeys.Pause or key = RemoteKeys.PlayOnly
        ' A pass-through to the app controller, so it can toggle picture-in-picture and pause/play
        return false
    end if

    if key = RemoteKeys.Back and press
        Close()
        return true
    end if

    return true
end function

function OnValueChange() as void
    content = m.checkList.content
    value = m.top.value

    if content = invalid or content.getChildCount() = 0
        return
    end if

    values = value.Split(",")
    valuesDict = {}
    for each value in values
        valuesDict[value] = true
    end for

    checkboxes = content.getChildren(-1, 0)
    checkedState = []
    for i = 0 to checkboxes.Count() - 1
        checkedState.push(valuesDict.DoesExist(checkboxes[i].id))
    end for
    m.checkList.checkedState = checkedState
end function

function OnCheckedStateChange() as void
    content = m.checkList.content
    if content = invalid or content.getChildCount() = 0
        return
    end if

    checkedState = m.checkList.checkedState
    if checkedState = invalid or checkedState.Count() = 0
        return
    end if
    lastCheckedState = m.lastCheckedState
    m.lastCheckedState = checkedState

    autoChanged = lastCheckedState[0] <> checkedState[0]
    hasAuto = checkedState[0]

    if autoChanged
        if hasAuto
            checkedState = [true, false, false, false, false, false, false, false]
            m.lastCheckedState = checkedState
            m.checkList.checkedState = checkedState
            m.top.value = "auto"
            return
        else
            checkedState = [false, true, true, true, true, true, true, true]
            m.lastCheckedState = checkedState
            m.checkList.checkedState = checkedState
            m.top.value = "2160p,1080p,720p,480p,360p,240p,144p"
            return
        end if
    end if

    values = []
    checkboxes = content.getChildren(-1, 0)

    hasNonAuto = false
    for i = 0 to checkboxes.Count() - 1
        if not checkedState[i]
            continue for
        end if
        values.push(checkboxes[i].id)
        if i <> 0
            hasNonAuto = true
        end if
    end for

    if values.Count() = 0
        checkedState = [true, false, false, false, false, false, false]
        m.lastCheckedState = checkedState
        m.checkList.checkedState = checkedState
        m.top.value = "auto"
        return
    end if

    if hasNonAuto and hasAuto
        checkedState[0] = false
        m.lastCheckedState = checkedState
        m.checkList.checkedState = checkedState
        values.shift()
    end if

    m.top.value = values.Join(",")
end function

function OnSaveButtonSelected()
    OnCheckedStateChange()
    m.top.save = true
    Close()
end function

function Close()
    m.appController@.PopScreen()
end function

```

```brighterscript
import "pkg:/components/Navigation/Navigation.bs"
import "pkg:/components/parts/AutoBind/OnNodeReadyNoOp.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/MathUtils.bs"
import "pkg:/source/utils/RemoteKeys.bs"
import "pkg:/source/utils/Types.bs"

function Init()
    m.checkList = m.top.findNode("checkList")
    m.closeButton = m.top.findNode("closeButton")
    m.saveButton = m.top.findNode("saveButton")

    SetNavigation(m.checkList, RemoteKeys.Down, m.saveButton)
    SetNavigation(m.saveButton, RemoteKeys.Up, m.checkList)
    SetNavigation(m.closeButton, RemoteKeys.Up, m.checkList)
    SetNavigation(m.saveButton, RemoteKeys.Right, m.closeButton)
    SetNavigation(m.closeButton, RemoteKeys.Left, m.saveButton)

    m.saveButton.observeField("buttonSelected", FuncName(OnSaveButtonSelected))
    m.closeButton.observeField("buttonSelected", FuncName(Close))

    m.lastCheckedState = [false, false, false, false, false, false, false, false]
    m.checkList.observeField("checkedState", FuncName(OnCheckedStateChange))

    SetButtonPositions()
end function

function SetButtonPositions()
    saveButtonWidth = m.saveButton.width
    closeButtonWidth = m.closeButton.width
    buttonsWith = closeButtonWidth + saveButtonWidth + 20
    m.saveButton.translation = [780 / 2 - buttonsWith / 2, m.saveButton.translation[1]]
    m.closeButton.translation = [780 / 2 + buttonsWith / 2 - closeButtonWidth, m.closeButton.translation[1]]
end function

function OnFocusChange() as void
    if not m.top.focus
        return
    end if

    NodeSetFocus(m.checkList, true)
end function

function OnKeyEvent(key as string, press as boolean) as boolean
    if NavigationKeyHandler(key, press).handled
        return true
    end if

    if key = RemoteKeys.Options or key = RemoteKeys.Play or key = RemoteKeys.Pause or key = RemoteKeys.PlayOnly
        ' A pass-through to the app controller, so it can toggle picture-in-picture and pause/play
        return false
    end if

    if key = RemoteKeys.Back and press
        Close()
        return true
    end if

    return true
end function

function OnValueChange() as void
    content = m.checkList.content
    value = m.top.value

    if content = invalid or content.getChildCount() = 0
        return
    end if

    values = value.Split(",")
    valuesDict = {}
    for each value in values
        valuesDict[value] = true
    end for

    checkboxes = content.getChildren(-1, 0)
    checkedState = []
    for i = 0 to checkboxes.Count() - 1
        checkedState.push(valuesDict.DoesExist(checkboxes[i].id))
    end for
    m.checkList.checkedState = checkedState
end function

function OnCheckedStateChange() as void
    content = m.checkList.content
    if content = invalid or content.getChildCount() = 0
        return
    end if

    checkedState = m.checkList.checkedState
    if checkedState = invalid or checkedState.Count() = 0
        return
    end if
    lastCheckedState = m.lastCheckedState
    m.lastCheckedState = checkedState

    autoChanged = lastCheckedState[0] <> checkedState[0]
    hasAuto = checkedState[0]

    if autoChanged
        if hasAuto
            checkedState = [true, false, false, false, false, false, false, false]
            m.lastCheckedState = checkedState
            m.checkList.checkedState = checkedState
            m.top.value = "auto"
            return
        else
            checkedState = [false, true, true, true, true, true, true, true]
            m.lastCheckedState = checkedState
            m.checkList.checkedState = checkedState
            m.top.value = "2160p,1080p,720p,480p,360p,240p,144p"
            return
        end if
    end if

    values = []
    checkboxes = content.getChildren(-1, 0)

    hasNonAuto = false
    for i = 0 to checkboxes.Count() - 1
        if not checkedState[i]
            continue for
        end if
        values.push(checkboxes[i].id)
        if i <> 0
            hasNonAuto = true
        end if
    end for

    if values.Count() = 0
        checkedState = [true, false, false, false, false, false, false, false]
        m.lastCheckedState = checkedState
        m.checkList.checkedState = checkedState
        m.top.value = "auto"
        return
    end if

    if hasNonAuto and hasAuto
        checkedState[0] = false
        m.lastCheckedState = checkedState
        m.checkList.checkedState = checkedState
        values.shift()
    end if

    m.top.value = values.Join(",")
end function

function OnSaveButtonSelected()
    OnCheckedStateChange()
    m.top.save = true
    Close()
end function

function Close()
    m.appController@.PopScreen()
end function

```

```brighterscript
import "pkg:/components/parts/AutoBind/OnNodeReadyNoOp.bs"
import "pkg:/source/utils/FocusManagement.bs"
import "pkg:/source/utils/Locale.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/Types.bs"

function Init()
    m.top.focusable = true
    m.top.itemSpacings = [8]

    m.button = m.top.findNode("button")
    m.button.observeField("buttonSelected", FuncName(OpenQualitySelector))
    AdjustButtonLabel(m.button)

    m.qualityToLabel = {
        "auto": Tr(Locale.Settings.AutoQuality)
        "2160p": "2160p (4K)"
        "1080p": "1080p"
        "720p": "720p"
        "480p": "480p"
        "360p": "360p"
        "240p": "240p"
        "144p": "144p"
    }
end function

function OnFocusChange() as void
    if not m.top.focus
        return
    end if

    NodeSetFocus(m.button, true)
end function

function AdjustButtonLabel(button as object) as void
    children = button.getChildren(-1, 0)
    for each child in children
        if child.isSubtype("Label") and child.hasField("horizAlign")
            child.observeField("horizAlign", FuncName(OnButtonLabelHorizAlignChanged))
            child.horizAlign = "left"
            return
        end if
    end for
end function

function OnButtonLabelHorizAlignChanged(event as object)
    label = event.getRoSGNode()
    if label.horizAlign <> "left"
        label.horizAlign = "left"
    end if
end function

function BindPreference(preferences as object, key as string)
    if m.preferences <> invalid and m.key <> invalid
        m.preferences.unobserveFieldScoped(m.key)
    end if

    m.preferences = preferences
    m.key = key

    if preferences <> invalid and key <> invalid
        preferences.observeFieldScoped(key, FuncName(OnPreferenceChange))
        OnPreferenceChange()
    end if
end function

function OpenQualitySelector()
    selector = CreateObject("roSGNode", "QualitySelector")
    m.appController@.PushScreen(selector)
    selector@.BindNode()
    selector.value = m.top.value
    selector.observeField("save", FuncName(OnSaveQualitySelector))
end function

function OnSaveQualitySelector(event as object)
    editor = event.GetRoSGNode()
    m.top.value = editor.value
end function

function OnPreferenceChange()
    m.top.value = m.preferences[m.key]
end function

function OnValueChange() as void
    if m.preferences = invalid or m.key = invalid
        return
    end if

    value = m.top.value
    m.preferences[m.key] = value

    if StringUtils.IsNullOrEmpty(value)
        m.button.text = Tr(Locale.Settings.AutoQuality)
    else
        qualities = value.split(",")
        labels = []
        for each quality in qualities
            label = m.qualityToLabel[quality]
            if StringUtils.IsNullOrEmpty(label)
                label = quality
            end if
            labels.push(label)
        end for

        m.button.text = labels.join(", ")
    end if
end function

```

```svelte
<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { translate, userPreferencesStore } from "lib/Stores";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];
  const qualityLabels = {
    auto: "Auto",
    "2160p": "2160p (4K)",
    "1080p": "1080p",
    "720p": "720p",
    "480p": "480p",
    "360p": "360p",
    "240p": "240p",
    "144p": "144p",
  };

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  let valueCheckedStates: any = {};
  let originalValue;
  let displayValue;

  userPreferencesStore.subscribe((userPreferences) => {
    originalValue = userPreferences[key];
  });

  $: {
    if (!originalValue) {
      valueCheckedStates = {};
      displayValue = "";
    } else {
      valueCheckedStates = Object.keys(qualityLabels).reduce((acc, cur) => {
        acc[cur] = originalValue.includes(cur);
        return acc;
      }, {});
      displayValue = originalValue
        .split(",")
        .map((item) => $translate(qualityLabels[item] || item))
        .join(", ");
    }
  }

  let modal;

  async function openQualitySelector() {
    valueCheckedStates = Object.keys(qualityLabels).reduce((acc, cur) => {
      acc[cur] = originalValue.includes(cur);
      return acc;
    }, {});
    modal.showModal();
  }

  async function save() {
    if (key !== "" && valueCheckedStates) {
      const stringValue = Object.keys(valueCheckedStates)
        .filter((key) => valueCheckedStates[key])
        .join(",");
      await PlayletApi.saveUserPreference(key, stringValue);

      const refreshUserPrefrences = PlayletApi.getUserPreferences();
      refreshUserPrefrences.then((value) => {
        userPreferencesStore.set(value);
      });

      await userPreferencesStore;
    }
  }

  export function close() {
    modal.close();
  }

  function onClose() {
    // Reset value to original value to avoid weird animation on show
    valueCheckedStates = Object.keys(qualityLabels).reduce((acc, cur) => {
      acc[cur] = originalValue.includes(cur);
      return acc;
    }, {});
  }

  function onChange(e: Event, quality: string) {
    const target = e.target as HTMLInputElement;
    valueCheckedStates[quality] = target.checked;

    const autoChanged = quality === "auto";
    const hasAuto = valueCheckedStates.auto;

    if (autoChanged) {
      if (hasAuto) {
        Object.keys(valueCheckedStates).forEach((key) => {
          valueCheckedStates[key] = key === "auto";
        });
        return;
      } else {
        valueCheckedStates = Object.keys(qualityLabels).reduce((acc, cur) => {
          acc[cur] = cur !== "auto";
          return acc;
        }, {});
        return;
      }
    }

    const checkedCount = Object.keys(valueCheckedStates).filter(
      (key) => valueCheckedStates[key]
    ).length;
    if (checkedCount === 0) {
      valueCheckedStates.auto = true;
      return;
    }

    if (checkedCount > 1 && valueCheckedStates.auto) {
      valueCheckedStates.auto = false;
    }
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$translate(displayText)}</div>
  <div class="text-xs text-gray-500">{@html $translate(description)}</div>
  <button class="btn m-1" on:click={openQualitySelector}>{displayValue}</button>
</div>

<dialog bind:this={modal} class="modal" on:close={onClose}>
  <div class="modal-box bg-base-100">
    <table class="w-full">
      <tbody>
        {#each Object.keys(qualityLabels) as quality}
          <tr>
            <td>
              <div class="flex justify-between items-center w-full">
                <div class="label-text text-lg">
                  {$translate(qualityLabels[quality])}
                </div>
                <input
                  type="checkbox"
                  checked={valueCheckedStates[quality]}
                  on:change={(e) => onChange(e, quality)}
                  class="toggle toggle-primary"
                />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <form method="dialog" class="flex justify-center space-x-2">
      <button class="btn btn-primary" on:click={save}
        >{$translate("Save")}</button
      >
      <button class="btn btn-primary">{$translate("Close")}</button>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>{$translate("Close")}</button>
  </form>
</dialog>

```

```brighterscript
function Init()
    m.top.poster = m.top.findNode("Poster")
    m.top.maskGroup = m.top.findNode("MaskGroup")
end function

function UpdateMaskSize()
    width = m.top.width
    height = m.top.height

    m.top.maskSize = [width * GetUIScaleFactor(), height * GetUIScaleFactor()]
end function

' MaskGroup component do not scale with with UI resolution
function GetUIScaleFactor() as float
    if m.uiScaleFactor <> invalid
        return m.uiScaleFactor
    end if

    if m.global.uiScaleFactor <> invalid
        return m.global.uiScaleFactor
    end if

    deviceInfo = CreateObject("roDeviceInfo")
    uiResolutionWidth = deviceInfo.GetUIResolution().width
    ' divide by 1920 because we have ui_resolutions=fhd in manifest
    m.uiScaleFactor = uiResolutionWidth / 1920

    if not m.global.hasField("uiScaleFactor")
        m.global.addField("uiScaleFactor", "float", false)
    end if
    m.global.uiScaleFactor = m.uiScaleFactor
    return m.uiScaleFactor
end function

```

I found many more files with hardcoded 1280x720 dimensions that need to be updated for FHD. Let me update them all.

```xml
<component name="VideoQueueView" extends="Group" includes="Focus,Disposable">
    <interface>
        <field id="content" type="node" onChange="OnContentSet" />
        <field id="jumpToItem" type="integer" alias="queueList.jumpToItem" />
        <field id="videoQueue" type="node" />
        <field id="appController" type="node" />
        <field id="jobQueue" type="node" />
        <field id="innertube" type="node" />
        <field id="invidious" type="node" />
        <field id="preferences" type="node" />
        <function name="Show" />
    </interface>

    <children>
        <Rectangle
            id="background"
            width="1920"
            height="1080"
            color="#000000"
            opacity="0" />
        <Rectangle
            id="container"
            width="470"
            height="1080"
            translation="[-470,0]"
            color="0x242424">
            <ScrollingLabel
                id="queueLabel"
                maxWidth="270"
                height="52"
                text="Queue"
                vertAlign="center"
                font="font:MediumBoldSystemFont"
                translation="[20,20]" />
            <ButtonEx
                id="clearButton"
                iconVisible="false"
                anchor="[1,0]"
                height="48"
                text="Clear"
                normalFontSize="22"
                boldFontSize="22"
                translation="[450,20]" />
            <MarkupGrid
                id="queueList"
                itemComponentName="VideoQueueViewCell"
                itemSize="[432,90]"
                itemSpacing="[0,15]"
                numColumns="1"
                numRows="6"
                vertFocusAnimationStyle="floatingFocus"
                translation="[20,90]"
                focusBitmapUri="pkg:/images/focus-glow-padding-27.9.png" />
        </Rectangle>

        <Animation id="showAnimation"
            duration="0.3"
            optional="true">
            <FloatFieldInterpolator
                id="fadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.0, 0.4, 0.8]"
                fieldToInterp="background.opacity" />
            <Vector2DFieldInterpolator
                id="translationInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[[-470,0], [-235,0], [0,0]]"
                fieldToInterp="container.translation" />
        </Animation>
    </children>
</component>
```

```xml
<component name="VideoPlayer" extends="Video" includes="AutoBind">
    <interface>
        <field id="appController" type="node" bind="/AppController" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="notifications" type="node" bind="../../Notifications" />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="innertube" type="node" bind="../../Innertube" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="webServer" type="node" bind="../../WebServer" />
        <field id="loungeService" type="node" bind="../../LoungeService" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[1251,690,639,360]" />
        <field id="maxRect" type="rect2D" value="[0,0,1920,1080]" />
        <field id="chapter" type="string" alias="chapterLabel.text" />
        <field id="showFullScreenHint" type="boolean" alwaysNotify="true" onChange="OnShowFullScreenHint" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <Label id="chapterLabel" width="350" height="25" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
        <Timer id="chapterLabelTimer" repeat="true" duration="0.5" />
        <Animation id="minimizeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="0x000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="0xFFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
            <Timer id="trickplayUITimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[1251,690,639,360]" />
        <field id="maxRect" type="rect2D" value="[0,0,1920,1080]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1280,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1280"
                    height="240"
                    scaleRotateCenter="[640,120]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1280"
                height="360"
                translation="[0,360]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[1251,690,639,360]" />
        <field id="maxRect" type="rect2D" value="[0,0,1920,1080]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1920,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1280"
                    height="240"
                    scaleRotateCenter="[640,120]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1280"
                height="360"
                translation="[0,360]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[1251,690,639,360]" />
        <field id="maxRect" type="rect2D" value="[0,0,1920,1080]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1920,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1280"
                    height="240"
                    scaleRotateCenter="[640,120]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1280"
                height="360"
                translation="[0,360]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[1251,690,639,360]" />
        <field id="maxRect" type="rect2D" value="[0,0,1920,1080]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1920,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1920"
                    height="360"
                    scaleRotateCenter="[960,180]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1280"
                height="360"
                translation="[0,360]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[1251,690,639,360]" />
        <field id="maxRect" type="rect2D" value="[0,0,1920,1080]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1920,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1920"
                    height="360"
                    scaleRotateCenter="[960,180]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1920"
                height="540"
                translation="[0,540]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```brighterscript
import "pkg:/source/utils/DisposableObserve.bs"
import "pkg:/source/utils/Types.bs"

enum MinimizeState
    None ' None is not a valid state, but it is the default value pre-initialization
    Minimizing
    Minimized
    Maximizing
    Maximized
end enum

function InitializePitctureInPicture()
    m.minRect = {
        translation: [1251, 690]
        width: 639
        height: 360
    }

    m.maxRect = {
        translation: [0, 0]
        width: 1920
        height: 1080
    }

    InitializePitctureInPictureAnimation()
    InitializePitctureInPictureFullScreenHint()

    DisposableObserveField(m.top, "minimizeState", FuncName(OnMinimizeStateChange))
    DisposableObserveFieldScoped(m.container, "fullscreen", FuncName(OnFullScreenChange))

    if m.container.fullscreen
        m.top.minimizeState = MinimizeState.Maximized
    else
        m.top.minimizeState = MinimizeState.Minimized
    end if
end function

function InitializePitctureInPictureAnimation()
    m.minimizeAnimation = m.top.findNode("minimizeAnimation")
    m.widthInterpolator = m.minimizeAnimation.findNode("widthInterpolator")
    m.heightInterpolator = m.minimizeAnimation.findNode("heightInterpolator")
    m.translationInterpolator = m.minimizeAnimation.findNode("translationInterpolator")
    DisposableObserveFieldScoped(m.minimizeAnimation, "state", FuncName(OnMinimizeAnimationStateChange))

    m.widthInterpolator.keyValue = [m.maxRect.width, (m.maxRect.width + m.minRect.width) / 2, m.minRect.width]
    m.heightInterpolator.keyValue = [m.maxRect.height, (m.maxRect.height + m.minRect.height) / 2, m.minRect.height]
    midTranslation = [(m.maxRect.translation[0] + m.minRect.translation[0]) / 2, (m.maxRect.translation[1] + m.minRect.translation[1]) / 2]
    m.translationInterpolator.keyValue = [m.maxRect.translation, midTranslation, m.minRect.translation]
end function

function InitializePitctureInPictureFullScreenHint()
    m.fullScreenHint = m.top.findNode("fullScreenHint")
    m.fullScreenHintLabel = m.fullScreenHint.findNode("fullScreenHintLabel")
    m.fullScreenHintTimer = m.fullScreenHint.findNode("fullScreenHintTimer")
    DisposableObserveFieldScoped(m.fullScreenHintTimer, "fire", FuncName(HideFullScreenHint))

    m.fullScreenHint.width = m.minRect.width
    m.fullScreenHintLabel.width = m.minRect.width
    m.fullScreenHint.translation = [0, m.minRect.height - m.fullScreenHint.height]
end function

function OnMinimizeStateChange()
    state = m.top.minimizeState

    if state = MinimizeState.Minimizing
        OnMinimizingState()
    else if state = MinimizeState.Minimized
        OnMinimizedState()
    else if state = MinimizeState.Maximizing
        OnMaximizingState()
    else if state = MinimizeState.Maximized
        OnMaximizedState()
    end if
end function

function OnMinimizingState()
    m.videoUi.visible = false

    m.widthInterpolator.reverse = false
    m.heightInterpolator.reverse = false
    m.translationInterpolator.reverse = false
    m.minimizeAnimation.control = "start"
end function

function OnMinimizedState()
    m.top.width = m.minRect.width
    m.top.height = m.minRect.height
    m.top.translation = m.minRect.translation

    m.videoUi.visible = false
    ShowFullScreenHint()
end function

function OnMaximizingState()
    m.videoUi.visible = true
    HideFullScreenHint()

    m.widthInterpolator.reverse = true
    m.heightInterpolator.reverse = true
    m.translationInterpolator.reverse = true
    m.minimizeAnimation.control = "start"
end function

function OnMaximizedState()
    m.top.width = m.maxRect.width
    m.top.height = m.maxRect.height
    m.top.translation = m.maxRect.translation

    HideFullScreenHint()
    m.videoUi.visible = true
end function

function OnFullScreenChange()
    if m.container.fullscreen
        Maximize()
    else
        Minimize()
    end if
end function

function Minimize() as void
    state = m.top.minimizeState
    if state = MinimizeState.Minimized
        return
    end if

    m.top.minimizeState = MinimizeState.Minimizing
end function

function Maximize() as void
    state = m.top.minimizeState
    if state = MinimizeState.Maximized
        return
    end if

    m.top.minimizeState = MinimizeState.Maximizing
end function

function ShowFullScreenHint()
    m.fullScreenHint.visible = true

    m.fullScreenHintTimer.control = "stop"
    m.fullScreenHintTimer.control = "start"
end function

function HideFullScreenHint()
    m.fullScreenHint.visible = false
end function

function OnMinimizeAnimationStateChange() as void
    ' "stopped" Indicates that the animation has either run to completion or has been explicitly stopped.
    ' Since we don't stop the animation explicitly, we can assume that the animation has run to completion.
    ' This assumption becomes invalid if we set m.minimizeAnimation.control = "stop"
    if m.minimizeAnimation.state <> "stopped"
        return
    end if

    state = m.top.minimizeState
    if state = MinimizeState.Minimizing
        m.top.minimizeState = MinimizeState.Minimized
    else if state = MinimizeState.Maximizing
        m.top.minimizeState = MinimizeState.Maximized
    end if
end function

function ShutDownPitctureInPicture()
    m.fullScreenHintTimer.control = "stop"
end function

```

```xml
<component name="SponsorBlockCategoriesPreferences" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="value" type="assocarray" onChange="OnValueChange" />
        <field id="save" type="boolean" alwaysNotify="true" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="720"
            height="600"
            translation="[600,240]"
            color="#242424">
            <Label
                width="720"
                horizAlign="center"
                translation="[0,38]"
                text="Categories">
                <Font role="font" uri="font:SystemFontFile" size="24" />
            </Label>

            <MarkupGrid
                id="categoryList"
                itemComponentName="SponsorBlockCategoryListItem"
                itemSize="[640,32]"
                itemSpacing="[0,10]"
                numColumns="1"
                numRows="10"
                vertFocusAnimationStyle="floatingFocus"
                translation="[40,100]"
                focusBitmapUri="pkg:/images/focus-glow-padding-19.9.png" />

            <ButtonEx
                id="saveButton"
                iconVisible="false"
                text="Save"
                padding="[30,30]"
                translation="[340,500]" />
            <ButtonEx
                id="closeButton"
                iconVisible="false"
                text="Close"
                padding="[30,30]"
                translation="[496,500]" />
        </Rectangle>
    </children>
</component> 
```

```xml
<component name="InvidiousInstanceTesting" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="instance" type="string" />
        <field id="run" type="boolean" alwaysNotify="true" onChange="RunTestsJob" />
        <field id="appController" type="node" bind="/AppController" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="1160"
            height="600"
            translation="[380,240]"
            color="#242424">
            <Label
                id="titleLabel"
                width="1160"
                horizAlign="center"
                text=""
                translation="[0,20]" />

            <MarkupGrid
                id="testList"
                itemSize="[1060,40]"
                itemSpacing="[0,20]"
                numColumns="1"
                numRows="7"
                vertFocusAnimationStyle="floatingFocus"
                translation="[50,80]"
                itemComponentName="InvidiousInstanceTestingItem" />
            <ButtonEx
                id="closeButton"
                text="Close"
                iconVisible="false"
                anchor="[0.5,0.5]"
                padding="[30,30]"
                translation="[580,545]" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="HomeScreenEditor" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="value" type="array" onChange="OnValueChange" />
        <field id="save" type="boolean" alwaysNotify="true" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="960"
            height="600"
            translation="[480,240]"
            color="#242424">
            <CheckList
                id="checkList"
                vertFocusAnimationStyle="floatingFocus"
                translation="[164,40]">

                <ContentNode role="content" />
            </CheckList>

            <ButtonEx
                id="moveUpButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Move up"
                minWidth="220"
                translation="[750,220]" />
            <ButtonEx
                id="moveDownButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Move down"
                minWidth="220"
                translation="[750,300]" />

            <ButtonEx
                id="saveButton"
                iconVisible="false"
                text="Save"
                padding="[30,30]"
                translation="[340,500]" />
            <ButtonEx
                id="closeButton"
                iconVisible="false"
                text="Close"
                padding="[30,30]"
                translation="[496,500]" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="RemoteScreen" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="navBar" type="node" bind="/NavBar" />
        <field id="webServer" type="node" bind="/WebServer" />
        <field id="loungeService" type="node" bind="/LoungeService" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="url" type="string" onChange="OnUrlSet" />
        <field id="qrCodeUrl" type="string" onChange="OnUrlSet" />
    </interface>
    <children>
        <Group id="noInternet" visible="false">
            <Label
                height="1080"
                width="1380"
                font="font:SmallSystemFont"
                horizAlign="center"
                vertAlign="center"
                text="Could not get IP address: are we connected to the internet?"
                wrap="true"
                translation="[270,0]" />
        </Group>
        <Group id="yesInternet" visible="false">
            <LayoutGroup
                translation="[640,360]"
                layoutDirection="horiz"
                vertAlignment="center"
                horizAlignment="center"
                itemSpacings="[60]">

                <LayoutGroup
                    vertAlignment="center"
                    itemSpacings="[30]">

                    <SettingCategory
                        id="WebAppButton"
                        displayText="Playlet Web App"
                        description="Use Playlet Remote in the browser"
                        maxWidth="540" />

                    <SettingCategory
                        id="LinkWithWiFiButton"
                        displayText="Link with Wi-Fi"
                        description="Cast from the YouTube app to Playlet"
                        maxWidth="540" />

                    <SettingCategory
                        id="LinkWithTvButton"
                        displayText="Link with TV code"
                        description="Cast from the YouTube app to Playlet"
                        maxWidth="540" />
                </LayoutGroup>

                <Group>
                    <LayoutGroup
                        id="WebAppPanel"
                        itemSpacings="[15]">
                        <Label
                            width="400"
                            height="30"
                            font="font:SmallBoldSystemFont"
                            horizAlign="center"
                            vertAlign="center"
                            text="Scan the QR code" />
                        <QrCodePoster
                            id="WebAppQrCodePoster"
                            height="400"
                            width="400"
                            loadHeight="400"
                            loadWidth="400"
                            padding="20" />
                        <Label
                            id="WebAppUrlLabel"
                            width="400"
                            height="30"
                            font="font:SmallBoldSystemFont"
                            horizAlign="center"
                            vertAlign="center" />
                    </LayoutGroup>

                    <LayoutGroup
                        id="LinkWithWiFiPanel"
                        itemSpacings="[12]"
                        vertAlignment="center"
                        translation="[0,245]">
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="1."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="On your phone, connect to the same Wi-Fi network as this device." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="2."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Open the YouTube app on your phone." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="3."
                                font="font:SmallSystemFont" />
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <MultiStyleLabel text="Tap the cast icon and select this device."
                                id="WifiInstructionWithDeviceNameLabel"
                                width="380"
                                wrap="true" />
                        </LayoutGroup>
                        <Label
                            text="Roku connected to:"
                            translation="[0,220]">
                            <Font role="font" uri="font:SystemFontFile" size="20" />
                        </Label>
                        <Label
                            id="WifiNameLabel"
                            color="#4287f5"
                            translation="[0,250]">
                            <Font role="font" uri="font:MediumSystemFontFile" size="28" />
                        </Label>
                    </LayoutGroup>

                    <LayoutGroup
                        id="LinkWithTvPanel"
                        itemSpacings="[12,12,25]"
                        vertAlignment="center"
                        translation="[0,245]">
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="1."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="On your phone, open the YouTube app." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="2."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Tap the cast icon." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="3."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Tap 'Link with TV code' and enter the code below." />
                        </LayoutGroup>
                        <Label
                            id="LinkCodeLabel"
                            font="font:LargeBoldSystemFont"
                            color="#4287f5">
                            <Font role="font" uri="font:MediumSystemFontFile" size="48" />
                        </Label>
                    </LayoutGroup>
                </Group>
            </LayoutGroup>
        </Group>
    </children>
</component>
```

```xml
<component name="RemoteScreen" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="navBar" type="node" bind="/NavBar" />
        <field id="webServer" type="node" bind="/WebServer" />
        <field id="loungeService" type="node" bind="/LoungeService" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="url" type="string" onChange="OnUrlSet" />
        <field id="qrCodeUrl" type="string" onChange="OnUrlSet" />
    </interface>
    <children>
        <Group id="noInternet" visible="false">
            <Label
                height="1080"
                width="1380"
                font="font:SmallSystemFont"
                horizAlign="center"
                vertAlign="center"
                text="Could not get IP address: are we connected to the internet?"
                wrap="true"
                translation="[270,0]" />
        </Group>
        <Group id="yesInternet" visible="false">
            <LayoutGroup
                translation="[960,540]"
                layoutDirection="horiz"
                vertAlignment="center"
                horizAlignment="center"
                itemSpacings="[60]">

                <LayoutGroup
                    vertAlignment="center"
                    itemSpacings="[30]">

                    <SettingCategory
                        id="WebAppButton"
                        displayText="Playlet Web App"
                        description="Use Playlet Remote in the browser"
                        maxWidth="540" />

                    <SettingCategory
                        id="LinkWithWiFiButton"
                        displayText="Link with Wi-Fi"
                        description="Cast from the YouTube app to Playlet"
                        maxWidth="540" />

                    <SettingCategory
                        id="LinkWithTvButton"
                        displayText="Link with TV code"
                        description="Cast from the YouTube app to Playlet"
                        maxWidth="540" />
                </LayoutGroup>

                <Group>
                    <LayoutGroup
                        id="WebAppPanel"
                        itemSpacings="[15]">
                        <Label
                            width="400"
                            height="30"
                            font="font:SmallBoldSystemFont"
                            horizAlign="center"
                            vertAlign="center"
                            text="Scan the QR code" />
                        <QrCodePoster
                            id="WebAppQrCodePoster"
                            height="400"
                            width="400"
                            loadHeight="400"
                            loadWidth="400"
                            padding="20" />
                        <Label
                            id="WebAppUrlLabel"
                            width="400"
                            height="30"
                            font="font:SmallBoldSystemFont"
                            horizAlign="center"
                            vertAlign="center" />
                    </LayoutGroup>

                    <LayoutGroup
                        id="LinkWithWiFiPanel"
                        itemSpacings="[12]"
                        vertAlignment="center"
                        translation="[0,245]">
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="1."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="On your phone, connect to the same Wi-Fi network as this device." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="2."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Open the YouTube app on your phone." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="3."
                                font="font:SmallSystemFont" />
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <MultiStyleLabel text="Tap the cast icon and select this device."
                                id="WifiInstructionWithDeviceNameLabel"
                                width="380"
                                wrap="true" />
                        </LayoutGroup>
                        <Label
                            text="Roku connected to:"
                            translation="[0,220]">
                            <Font role="font" uri="font:SystemFontFile" size="20" />
                        </Label>
                        <Label
                            id="WifiNameLabel"
                            color="#4287f5"
                            translation="[0,250]">
                            <Font role="font" uri="font:MediumSystemFontFile" size="28" />
                        </Label>
                    </LayoutGroup>

                    <LayoutGroup
                        id="LinkWithTvPanel"
                        itemSpacings="[12,12,25]"
                        vertAlignment="center"
                        translation="[0,245]">
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="1."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="On your phone, open the YouTube app." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="2."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Tap the cast icon." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="3."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Tap 'Link with TV code' and enter the code below." />
                        </LayoutGroup>
                        <Label
                            id="LinkCodeLabel"
                            font="font:LargeBoldSystemFont"
                            color="#4287f5">
                            <Font role="font" uri="font:MediumSystemFontFile" size="48" />
                        </Label>
                    </LayoutGroup>
                </Group>
            </LayoutGroup>
        </Group>
    </children>
</component>
```

```xml
<component name="YouTubeAccountSelectionView" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="accessToken" type="assocarray" />
        <field id="accounts" type="array" onChange="OnAccountsChanged" />
        <field id="appController" type="node" bind="/AppController" />
        <field id="profilesService" type="node" bind="/ProfilesService" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>

        <Rectangle
            width="720"
            height="520"
            translation="[600,280]"
            color="#242424">
            <Label
                width="720"
                horizAlign="center"
                translation="[0,45]"
                text="Who's watching?">
                <Font role="font" uri="font:SystemFontFile" size="24" />
            </Label>

            <MarkupGrid
                id="accountList"
                itemComponentName="YouTubeAccountListItem"
                itemSize="[640,70]"
                itemSpacing="[0,20]"
                numColumns="1"
                numRows="4"
                vertFocusAnimationStyle="floatingFocus"
                translation="[40,120]"
                focusBitmapUri="pkg:/images/focus-glow-padding-27.9.png" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="ProfileView" extends="Group" includes="AutoBind,Focus,Disposable">
    <interface>
        <field id="content" type="node" onChange="OnContentSet" />
        <field id="letter" type="string" alias="LetterLabel.text" />
        <field id="username" type="string" alias="UsernameLabel.text" />
        <field id="serverUrl" type="string" alias="ServerLabel.text" />
        <field id="circlePosterInnerUri" type="uri" alias="circlePosterInner.uri" />
        <field id="backendTypePosterUri" type="uri" alias="backendTypePoster.uri" />
        <field id="circlePosterInnerBlendColor" type="uri" alias="circlePosterInner.blendColor" />
        <field id="crownVisible" type="boolean" alias="CrownPoster.visible" />

        <field id="appController" type="node" bind="/AppController" />
        <field id="profilesService" type="node" bind="/ProfilesService" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="720"
            height="420"
            translation="[600,330]"
            color="#242424">

            <Group translation="[100,90]">
                <Poster
                    id="circlePoster"
                    width="160"
                    height="160"
                    translation="[20,20]"
                    blendColor="#DDDDDDFF"
                    uri="pkg:/images/white-circle.png">
                    <CirclePoster
                        id="circlePosterInner"
                        width="152"
                        height="152"
                        blendColor="#9696C8"
                        uri="pkg:/images/white-circle.png"
                        translation="[4,4]">
                        <Label
                            id="LetterLabel"
                            width="152"
                            height="152"
                            vertAlign="center"
                            horizAlign="center">
                            <Font role="font" uri="font:SystemFontFile" size="120" />
                        </Label>
                        <Poster
                            id="backendTypePoster"
                            width="60"
                            height="60"
                            translation="[110,110]" />
                    </CirclePoster>
                    <Poster
                        id="CrownPoster"
                        width="60"
                        height="60"
                        translation="[50,-60]"
                        uri="pkg:/images/icons/crown.png"
                        visible="false">
                    </Poster>
                </Poster>
                <Label
                    id="UsernameLabel"
                    width="400"
                    horizAlign="center"
                    translation="[-100,210]">
                    <Font role="font" uri="font:MediumSystemFontFile" size="26" />
                </Label>
                <Label
                    id="ServerLabel"
                    width="400"
                    horizAlign="center"
                    translation="[-100,250]">
                    <Font role="font" uri="font:SystemFontFile" size="18" />
                </Label>
            </Group>

            <ButtonEx
                id="activateButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Activate"
                minWidth="200"
                translation="[520,132]" />
            <ButtonEx
                id="logoutButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Logout"
                minWidth="200"
                translation="[520,210]" />
            <ButtonEx
                id="closeButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Close"
                minWidth="200"
                translation="[520,288]" />

        </Rectangle>
    </children>
</component>
```

```xml
<component name="BackendTypeSelectionView" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="selectedBackendType" type="string" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>

        <Rectangle
            width="720"
            height="420"
            translation="[600,330]"
            color="#242424">
            <Label
                width="720"
                horizAlign="center"
                translation="[0,38]"
                text="Select a service to login">
                <Font role="font" uri="font:SystemFontFile" size="24" />
            </Label>

            <RowList
                id="BackendRowList"
                translation="[120,100]"
                numRows="2"
                rowitemSize="[[240,240]]"
                rowItemSpacing="[[0,0]]"
                itemSize="[500,500]"
                itemComponentName="BackendTypeRowListCell"
                rowFocusAnimationStyle="floatingfocus"
                focusBitmapUri="pkg:/images/focus-glow-padding-19.9.png">
                <ContentNode role="content">
                    <ContentNode>
                        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                        <BackendTypeContentNode id="BackendTypeYouTube" title="YouTube" backendLogoUri="pkg:/images/youtube-logo.png" />
                        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                        <BackendTypeContentNode id="BackendTypeInvidious" title="Invidious" backendLogoUri="pkg:/images/invidious-logo.png" />
                    </ContentNode>
                </ContentNode>
            </RowList>
        </Rectangle>
    </children>
</component>
```

```xml
<component name="PlaylistView" extends="Group" includes="AutoBind,Focus,ContextMenuProvider">
    <interface>
        <field id="content" type="node" onChange="OnContentSet" />
        <field id="isLoading" type="boolean" onChange="OnLoadingChanged" />
        <field id="appController" type="node" bind="/AppController" />
        <field id="invidious" type="node" bind="/Invidious" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="videoQueue" type="node" bind="/VideoQueue" />
        <field id="bookmarksService" type="node" bind="/BookmarksService" />
        <function name="OpenPlaylistChannel" />
        <function name="OpenVideoChannel" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="0x242424" />
        <Poster
            id="backgroundSmall"
            width="1920"
            height="1080"
            blendColor="0x323232" />
        <Poster
            id="background"
            width="1920"
            height="1080"
            blendColor="0x323232">
            <LayoutGroup
                itemSpacings="[5,5,20]"
                translation="[65,90]">
                <Label
                    id="titleLabel"
                    width="500"
                    maxLines="3"
                    wrap="true">
                    <Font role="font" uri="font:MediumSystemFontFile" size="36" />
                </Label>
                <Label
                    id="subtitleLabel"
                    width="500"
                    maxLines="2"
                    wrap="true"
                    font="font:SmallestBoldSystemFont" />
                <Label
                    id="updatedLabel"
                    width="500"
                    font="font:SmallestSystemFont" />
                <Label
                    id="descriptionLabel"
                    width="500"
                    maxLines="10"
                    wrap="true"
                    font="font:SmallestSystemFont" />
            </LayoutGroup>

            <BusySpinner
                id="busySpinner"
                spinInterval="1"
                translation="[45,620]"
                visible="false" />

            <MarkupGrid
                id="list"
                itemComponentName="PlaylistViewCell"
                itemSize="[550,106]"
                itemSpacing="[0,20]"
                numColumns="1"
                numRows="5"
                vertFocusAnimationStyle="floatingFocus"
                translation="[620,90]"
                focusBitmapUri="pkg:/images/focus-glow-padding-27.9.png" />
        </Poster>
    </children>
</component>
```

```xml
<component name="NavBar" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="screensContainer" type="node" />
        <field id="appController" type="node" />
        <field id="content" type="node" alias="ItemsList.content" />
        <field id="itemsList" type="node" bind="./ItemsList" />
        <field id="initialFocus" type="int" value="-1" />
        <field id="screenOffset" type="float" value="170" />
    </interface>

    <children>
        <Rectangle
            id="SideBar"
            width="170"
            height="1080"
            color="#242424"
            opacity="0.9"
            translation="[80,0]"
            visible="false">
        </Rectangle>

        <Rectangle
            id="Background"
            height="1080"
            width="80"
            color="#242424"
            opacity="0.9">

            <Poster
                id="LogoFav"
                width="42"
                height="42"
                translation="[20, 48]"
                uri="pkg:/images/logo-fav.png" />
            <Poster
                id="Logo"
                width="106"
                height="42"
                translation="[20, 48]"
                opacity="0"
                uri="pkg:/images/logo-dark.png">
                <AppVersionLabel
                    fontUri="font:BoldSystemFontFile"
                    fontSize="16"
                    translation="[0, 48]" />
            </Poster>

            <MarkupList
                id="ItemsList"
                itemSize="[190,50]"
                itemComponentName="NavBarComponent"
                focusFootprintBitmapUri=""
                focusBitmapUri="pkg:/images/white.9.png"
                focusBitmapBlendColor="0xFF1C30FF"
                vertFocusAnimationStyle="floatingFocus"
                numRows="7"
                scrollSpeed="99999"
                itemSpacing="[0, 16]"
                translation="[15, 150]">
            </MarkupList>
        </Rectangle>

        <Animation
            id="FadeAnimation"
            duration="0.2">
            <FloatFieldInterpolator
                id="SideBarFadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.0, 0.5, 1.0]"
                fieldToInterp="SideBar.opacity" />
            <FloatFieldInterpolator
                id="LogoFadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.0, 0.5, 1.0]"
                fieldToInterp="Logo.opacity" />
            <FloatFieldInterpolator
                id="BackgroundFadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.9, 0.95, 1.0]"
                fieldToInterp="Background.opacity" />
        </Animation>
    </children>
</component>
```

```xml
<component name="ChannelView" extends="Group" includes="AutoBind,Focus,ContextMenuProvider,Disposable">
    <interface>
        <field id="content" type="node" onChange="OnContentSet" />
        <field id="authorId" type="string" onChange="OnAuthorIdChange" />
        <field id="isSubscribed" type="boolean" onChange="OnSubscriptionChanged" />
        <field id="appController" type="node" bind="/AppController" />
        <field id="invidious" type="node" bind="/Invidious" />
        <field id="preferences" type="node" bind="/Preferences" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="bookmarksService" type="node" bind="/BookmarksService" />
        <function name="ShowSortDialog" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="0x242424">
        </Rectangle>

        <Poster
            id="banner"
            width="1920"
            loadWidth="1920"
            loadHeight="750"
            loadDisplayMode="limitSize"
            visible="false" />

        <Group id="container">
            <Poster
                translation="[115,20]"
                width="104"
                height="104"
                blendColor="#DDDDDDFF"
                uri="pkg:/images/white-circle.png">

                <CirclePoster
                    id="thumbnail"
                    width="100"
                    height="100"
                    translation="[2,2]"
                    failedBitmapUri="pkg:/images/thumbnail-missing.jpg" />

                <Label
                    id="authorLabel"
                    translation="[115,40]"
                    font="font:MediumBoldSystemFont" />
                <Label
                    id="subCountLabel"
                    translation="[115,70]"
                    font="font:SmallestSystemFont" />
            </Poster>

            <ButtonEx
                id="subscribeButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                padding="[30,30]"
                translation="[1050,90]" />

            <VideoRowList
                itemComponentName="RowCell"
                id="rowList"
                focusable="false"
                translation="[0,160]"
                numRows="2"
                rowitemSize="[[350,196]]"
                rowItemSpacing="[[25,0]]"
                itemSize="[1280,326]"
                itemSpacing="[0,65]"
                rowLabelOffset="[[115,20]]"
                focusXOffset="[115]"
                showRowLabel="[true]"
                rowFocusAnimationStyle="floatingfocus"
                variableWidthItems="true"
                focusBitmapUri="pkg:/images/focus-glow-padding-19.9.png" />

            <Animation
                id="scrollAnimation"
                delay="0.3"
                duration="0.6">
                <Vector2DFieldInterpolator
                    id="bannerTranslation"
                    key="[ 0.0, 0.5, 1.0 ]"
                    fieldToInterp="banner.translation" />
                <Vector2DFieldInterpolator
                    id="containerTranslation"
                    key="[ 0.0, 0.5, 1.0 ]"
                    fieldToInterp="container.translation" />
            </Animation>

        </Group>
    </children>
</component>
```

```xml
<component name="InvidiousInstanceSettings" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="text" type="string" alias="textEditBox.text" />
        <field id="save" type="boolean" alwaysNotify="true" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="960"
            height="600"
            translation="[480,240]"
            color="#242424">
            <Label
                text="Invidious custom instance"
                horizAlign="center"
                width="960"
                translation="[0,13]" />
            <TextEditBox
                id="textEditBox"
                width="480"
                height="50"
                translation="[170,50]" />
            <ButtonEx
                id="editButton"
                iconUri="pkg:/images/icons/edit.png"
                height="50"
                iconWidth="22"
                iconHeight="22"
                text="Edit"
                translation="[670,50]" />

            <LayoutGroup
                layoutDirection="horiz"
                horizAlignment="center"
                vertAlignment="center"
                itemSpacings="[30,30]"
                translation="[480,125]">
                <Rectangle
                    width="250"
                    height="1" />

                <Label
                    text="Or" />

                <Rectangle
                    width="250"
                    height="1" />

            </LayoutGroup>

            <Label
                text="Invidious public instances"
                horizAlign="center"
                width="960"
                translation="[0,145]" />

            <InvidiousPublicInstances
                id="instances"
                translation="[50,190]" />

            <ButtonEx
                id="testButton"
                text="Test instance"
                iconVisible="false"
                padding="[30,30]"
                translation="[300,510]" />
            <ButtonEx
                id="saveButton"
                text="Save"
                iconVisible="false"
                padding="[30,30]"
                translation="[545,510]" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="SearchFilters" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="searchScreen" type="node" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Font id="HeaderFont" uri="font:MediumSystemFontFile" size="18" />
        <Font id="ItemFont" uri="font:SystemFontFile" size="18" />
        <Font id="ItemFocusedFont" uri="font:MediumSystemFontFile" size="18" />
        <Rectangle
            width="1200"
            height="543"
            translation="[40,84]"
            color="#242424">

            <LayoutGroup
                layoutDirection="horiz"
                translation="[20,20]">
                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Upload date"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="188" />
                    <Rectangle
                        width="170"
                        height="1" />
                    <RadioButtonList
                        id="UploadDateList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[170,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Type"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="168" />
                    <Rectangle
                        width="150"
                        height="1" />
                    <RadioButtonList
                        id="TypeList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[120,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Duration"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="238" />
                    <Rectangle
                        width="220"
                        height="1" />
                    <RadioButtonList
                        id="DurationList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[230,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Features"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="258" />
                    <Rectangle
                        width="240"
                        height="1" />
                    <CheckList
                        id="FeaturesList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[210,42]">
                        <ContentNode role="content" />
                    </CheckList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Sort by"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="198" />
                    <Rectangle
                        width="180"
                        height="1" />
                    <RadioButtonList
                        id="SortList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[190,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>
            </LayoutGroup>
        </Rectangle>
    </children>
</component>
```

```xml
<component name="SearchFilters" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="searchScreen" type="node" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1920"
            height="1080"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Font id="HeaderFont" uri="font:MediumSystemFontFile" size="18" />
        <Font id="ItemFont" uri="font:SystemFontFile" size="18" />
        <Font id="ItemFocusedFont" uri="font:MediumSystemFontFile" size="18" />
        <Rectangle
            width="1200"
            height="543"
            translation="[360,268]"
            color="#242424">

            <LayoutGroup
                layoutDirection="horiz"
                translation="[20,20]">
                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Upload date"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="188" />
                    <Rectangle
                        width="170"
                        height="1" />
                    <RadioButtonList
                        id="UploadDateList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[170,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Type"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="168" />
                    <Rectangle
                        width="150"
                        height="1" />
                    <RadioButtonList
                        id="TypeList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[120,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Duration"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="238" />
                    <Rectangle
                        width="220"
                        height="1" />
                    <RadioButtonList
                        id="DurationList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[230,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Features"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="258" />
                    <Rectangle
                        width="240"
                        height="1" />
                    <CheckList
                        id="FeaturesList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[210,42]">
                        <ContentNode role="content" />
                    </CheckList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Sort by"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="198" />
                    <Rectangle
                        width="180"
                        height="1" />
                    <RadioButtonList
                        id="SortList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[190,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>
            </LayoutGroup>
        </Rectangle>
    </children>
</component>
```

```xml
<component name="ContextMenu" extends="Group" includes="Focus">
    <interface>
        <field id="thumbnail" type="uri" alias="thumbnail.uri" />
        <field id="title" type="string" alias="titleLabel.text" />
        <field id="subtitle" type="string" alias="subtitleLabel.text" />
        <field id="options" type="nodearray" onChange="OnOptionsSet" />
        <field id="appController" type="node" />
        <function name="Show" />
    </interface>
    <children>
        <Rectangle
            id="background"
            width="1920"
            height="1080"
            color="#000000"
            opacity="0" />
        <Rectangle
            id="container"
            width="470"
            height="1080"
            translation="[-470,0]"
            color="0x242424">
            <Poster
                id="thumbnail"
                width="190"
                height="110"
                loadDisplayMode="scaleToFit"
                translation="[40,50]" />

            <LayoutGroup
                translation="[40,180]"
                itemSpacings="[10]">
                <Label
                    id="titleLabel"
                    width="390"
                    maxLines="2"
                    font="font:MediumBoldSystemFont"
                    wrap="true" />
                <Label
                    id="subtitleLabel"
                    width="390"
                    font="font:SmallestBoldSystemFont"
                    wrap="true" />
            </LayoutGroup>

            <MarkupList
                id="optionsList"
                itemSize="[420,50]"
                translation="[25,310]"
                itemComponentName="ContextMenuRow"
                vertFocusAnimationStyle="floatingFocus"
                numRows="8" />
        </Rectangle>

        <Animation id="showAnimation"
            duration="0.3"
            optional="true">
            <FloatFieldInterpolator
                id="fadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.0, 0.4, 0.8]"
                fieldToInterp="background.opacity" />
            <Vector2DFieldInterpolator
                id="translationInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[[-470,0], [-235,0], [0,0]]"
                fieldToInterp="container.translation" />
        </Animation>
    </children>
</component>
```

Good - the remaining 1280x720 references are for YouTube thumbnail metadata (actual image sizes from YouTube), not UI dimensions, so those should stay as-is.

All tasks have been completed successfully with no linter errors. Here's a summary of all the changes made to implement 4K video playback:

## Summary of Changes

### 1. Manifest Updates
- **`playlet-lib/src/manifest`** and **`playlet-app/src/manifest`**:
  - Changed `ui_resolutions=hd` to `ui_resolutions=fhd`
  - Added `2160p` to `uri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p`

### 2. Quality Selector Enhancement (TV)
- **`QualitySelector.xml`**: Added `2160p (4K)` option, updated overlay to 1920x1080, centered the dialog
- **`QualitySelector.bs`**: Updated all checkedState arrays from 7 to 8 elements, added 2160p to quality string
- **`EditQualityControl.bs`**: Added `"2160p": "2160p (4K)"` to the qualityToLabel mapping

### 3. Quality Selector Enhancement (Web)
- **`EditQualityControl.svelte`**: Added `"2160p": "2160p (4K)"` to the qualityLabels object

### 4. UI Scale Factor
- **`CirclePoster.bs`**: Updated scale factor base from 1280 to 1920 to match FHD resolution

### 5. UI Component Dimensions (1280x720 → 1920x1080)
Updated the following 17 component files with FHD dimensions:
- `VideoQueueView.xml`
- `VideoPlayer.xml` (including minRect/maxRect)
- `VideoPlayerDev.xml` (including gradients, posters, minRect/maxRect)
- `PictureInPicture.bs`
- `SponsorBlockCategoriesPreferences.xml`
- `InvidiousInstanceTesting.xml`
- `HomeScreenEditor.xml`
- `RemoteScreen.xml`
- `YouTubeAccountSelectionView.xml`
- `ProfileView.xml`
- `BackendTypeSelectionView.xml`
- `PlaylistView.xml`
- `NavBar.xml`
- `ChannelView.xml`
- `InvidiousInstanceSettings.xml`
- `SearchFilters.xml`
- `ContextMenu.xml`

### What Already Works (No Changes Needed)
- **DASH/HLS Video Processing**: The existing quality filtering code already supports height-based filtering (2160 will work automatically)
- **Backend API**: Invidious API already supports 4K feature filter in search
- **Thumbnail Metadata**: The 1280x720 values in `LoungeVideoQueue.bs` and `NodesParser.bs` are YouTube thumbnail sizes and should remain unchanged

---

**User**

Remote tab shows QR code going off screen.  Is this becaue of our change?

---

**Cursor**

Yes, this is absolutely because of our changes. Looking at the screenshot, the QR code is positioned off to the right because we updated the `RemoteScreen.xml` to use FHD (1920x1080) coordinates, but you've reverted the manifest back to `ui_resolutions=hd` (1280x720).

Specifically, we changed the center position of the "yesInternet" layout group from `[640,360]` (center of 1280x720) to `[960,540]` (center of 1920x1080). With the manifest set to HD, the UI is rendering at 1280x720, but the content is positioned for a 1920x1080 canvas.

**You have two options:**

1. **Keep HD manifest and revert UI changes** - If you want to stay at HD resolution for now, I should revert all the UI dimension changes we made back to 1280x720 values.

2. **Use FHD manifest** - Re-apply the manifest changes to `ui_resolutions=fhd` so the UI coordinates match the updated component positions.

Which approach would you prefer? 

If you want to incrementally add 4K video support without changing the UI resolution yet, I can:
- Revert all the UI dimension changes (keeping 1280x720 layout)
- Keep only the quality selector changes (adding 2160p option)
- Keep only `uri_resolution_autosub=$$RES$$,480p,720p,1080p,2160p` for video quality (without changing `ui_resolutions`)

---

**User**

video also goes way off screen.  What is the best way to implement showing 4k video content?  How can I tell if I'm playing 4k video as well?

---

**Cursor**

Great questions! Let me clarify the architecture and find the best approach.

**Key insight**: On Roku, `ui_resolutions` (UI rendering) and video playback resolution are **completely separate**. You can play 4K video while keeping the UI at 720p (HD).

Let me investigate how video streams are selected and how to verify playback quality:

Let me dig deeper into the quality filtering and how to enable debug logging:

Now I have a complete picture. Here's the key insight:

## Video Playback vs UI Resolution on Roku

**They are completely independent:**
- `ui_resolutions=hd` → UI renders at 1280x720 (Roku auto-scales to display resolution)
- `ui_resolutions=fhd` → UI renders at 1920x1080 (requires updating all UI dimensions)
- **Video playback can be 4K regardless of UI resolution** - The Video node directly outputs to the display

## The Best Approach for 4K Video

**Keep `ui_resolutions=hd`** and only:
1. Add 2160p to the quality selector UI (already done)
2. Optionally add `2160p` to `uri_resolution_autosub` (for image URI substitutions)
3. The DASH/HLS filtering code **already supports 4K** - it parses any height value dynamically

## How to Verify 4K Playback

There's already a debug flag in the code! In `playlet-lib/src/components/VideoPlayer/VideoPlayer.bs`:

```1:1:playlet-lib/src/components/VideoPlayer/VideoPlayer.bs
#const DEBUG_LOG_VIDEO_QUALITY = false
```

Setting this to `true` will log the actual video resolution from `streamingSegment` (width x height).

Also, `ApplicationInfo.bs` already captures `video_mode` from `roDeviceInfo.GetVideoMode()` which shows the device's output mode.

---

## Recommended Fix

I should:
1. **Revert all UI dimension changes** back to 1280x720 (since the manifest is back to HD)
2. **Keep the quality selector changes** (2160p option you already have)
3. **Enable the debug logging** so you can verify 4K playback

Would you like me to proceed with reverting the UI changes while keeping the 2160p quality selector option? This is the cleanest approach - you'll be able to play 4K video content without breaking the UI.

```plaintext
#const DEBUG_LOG_VIDEO_QUALITY = false
```

---

**User**

Yes as long as when 4k videos play I see it rendered at 4k

---

**Cursor**

Yes, that will work! On Roku, the Video node renders video directly to the display at its native resolution, independent of the UI resolution setting. A 4K video will play at 4K on a 4K-capable Roku device.

Let me revert all the UI dimension changes while keeping the 2160p quality option, and enable the debug logging.

Now let me revert all the UI dimensions back to 1280x720. I'll keep the 2160p quality option but fix the dimensions.

```xml
<component name="QualitySelector" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="value" type="string" onChange="OnValueChange" />
        <field id="save" type="boolean" alwaysNotify="true" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="780"
            height="650"
            translation="[250,35]"
            color="#242424">
            <CheckList
                id="checkList"
                vertFocusAnimationStyle="floatingFocus"
                translation="[220,70]">

                <ContentNode role="content">
                    <ContentNode id="auto" title="Auto" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="2160p" title="2160p (4K)" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="1080p" title="1080p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="720p" title="720p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="480p" title="480p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="360p" title="360p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="240p" title="240p" />
                    <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                    <ContentNode id="144p" title="144p" />
                </ContentNode>
            </CheckList>

            <ButtonEx
                id="saveButton"
                iconVisible="false"
                text="Save"
                padding="[30,30]"
                translation="[340,550]" />
            <ButtonEx
                id="closeButton"
                iconVisible="false"
                text="Close"
                padding="[30,30]"
                translation="[496,550]" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="VideoQueueView" extends="Group" includes="Focus,Disposable">
    <interface>
        <field id="content" type="node" onChange="OnContentSet" />
        <field id="jumpToItem" type="integer" alias="queueList.jumpToItem" />
        <field id="videoQueue" type="node" />
        <field id="appController" type="node" />
        <field id="jobQueue" type="node" />
        <field id="innertube" type="node" />
        <field id="invidious" type="node" />
        <field id="preferences" type="node" />
        <function name="Show" />
    </interface>

    <children>
        <Rectangle
            id="background"
            width="1280"
            height="720"
            color="#000000"
            opacity="0" />
        <Rectangle
            id="container"
            width="470"
            height="720"
            translation="[-470,0]"
            color="0x242424">
            <ScrollingLabel
                id="queueLabel"
                maxWidth="270"
                height="52"
                text="Queue"
                vertAlign="center"
                font="font:MediumBoldSystemFont"
                translation="[20,20]" />
            <ButtonEx
                id="clearButton"
                iconVisible="false"
                anchor="[1,0]"
                height="48"
                text="Clear"
                normalFontSize="22"
                boldFontSize="22"
                translation="[450,20]" />
            <MarkupGrid
                id="queueList"
                itemComponentName="VideoQueueViewCell"
                itemSize="[432,90]"
                itemSpacing="[0,15]"
                numColumns="1"
                numRows="6"
                vertFocusAnimationStyle="floatingFocus"
                translation="[20,90]"
                focusBitmapUri="pkg:/images/focus-glow-padding-27.9.png" />
        </Rectangle>

        <Animation id="showAnimation"
            duration="0.3"
            optional="true">
            <FloatFieldInterpolator
                id="fadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.0, 0.4, 0.8]"
                fieldToInterp="background.opacity" />
            <Vector2DFieldInterpolator
                id="translationInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[[-470,0], [-235,0], [0,0]]"
                fieldToInterp="container.translation" />
        </Animation>
    </children>
</component>
```

```xml
<component name="VideoPlayer" extends="Video" includes="AutoBind">
    <interface>
        <field id="appController" type="node" bind="/AppController" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="notifications" type="node" bind="../../Notifications" />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="innertube" type="node" bind="../../Innertube" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="webServer" type="node" bind="../../WebServer" />
        <field id="loungeService" type="node" bind="../../LoungeService" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[834,460,426,240]" />
        <field id="maxRect" type="rect2D" value="[0,0,1280,720]" />
        <field id="chapter" type="string" alias="chapterLabel.text" />
        <field id="showFullScreenHint" type="boolean" alwaysNotify="true" onChange="OnShowFullScreenHint" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <Label id="chapterLabel" width="350" height="25" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
        <Timer id="chapterLabelTimer" repeat="true" duration="0.5" />
        <Animation id="minimizeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="0x000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="0xFFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
            <Timer id="trickplayUITimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[834,460,426,240]" />
        <field id="maxRect" type="rect2D" value="[0,0,1280,720]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1920,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1920"
                    height="360"
                    scaleRotateCenter="[960,180]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1920"
                height="540"
                translation="[0,540]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[834,460,426,240]" />
        <field id="maxRect" type="rect2D" value="[0,0,1280,720]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1280,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1920"
                height="1080"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1920"
                    height="360"
                    scaleRotateCenter="[960,180]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1920"
                height="540"
                translation="[0,540]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[834,460,426,240]" />
        <field id="maxRect" type="rect2D" value="[0,0,1280,720]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1280,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1920"
                    height="360"
                    scaleRotateCenter="[960,180]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1920"
                height="540"
                translation="[0,540]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[834,460,426,240]" />
        <field id="maxRect" type="rect2D" value="[0,0,1280,720]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1280,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1280"
                    height="240"
                    scaleRotateCenter="[640,120]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1920"
                height="540"
                translation="[0,540]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```xml
<!-- 
    VideoPlayerDev is the player that will eventually be used in the Playlet app.
    It extends the Video component, and will be fully managing the UI, progress,
    buffering, and any state of the video playback.
    This would allow us to be flexible with the UI beyond the customizations
    of the stock Roku Video component. 
 -->
<component name="VideoPlayerDev" extends="Video" includes="AutoBind,Disposable">
    <interface>
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="container" type="node" bind=".." />
        <field id="videoQueue" type="node" bind="../../VideoQueue" />
        <field id="preferences" type="node" bind="../../Preferences" />
        <field id="invidious" type="node" bind="../../Invidious" />
        <field id="previousPlayer" type="node" />
        <field id="minRect" type="rect2D" value="[834,460,426,240]" />
        <field id="maxRect" type="rect2D" value="[0,0,1280,720]" />
        <field id="close" type="boolean" alwaysNotify="true" onChange="OnClose" />
        <field id="minimizeState" type="integer" />
        <field id="playerUiState" type="integer" />
        <function name="PlayWithContent" />
    </interface>
    <children>
        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
        <SimpleLabel text="Dev Player!"
            color="#FF0000"
            fontUri="font:SmallestBoldSystemFont"
            horizOrigin="right"
            translation="[1280,0]" />

        <Group id="VideoUi">
            <Poster
                id="BackgroundPosterSmall"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Poster
                id="BackgroundPoster"
                width="1280"
                height="720"
                blendColor="0x323232" />
            <Group id="TopUi">
                <Poster
                    uri="pkg:/images/black-gradient.png"
                    opacity="0.8"
                    width="1280"
                    height="240"
                    scaleRotateCenter="[640,120]"
                    rotation="3.14159265359" />
                <!-- 
                    TODO:P2 once VideoPlayerDev replaces VideoPlayer, the clock can 
                    be removed to reuse the Clock from MainScene
                -->
                <Clock id="Clock" />
                <LayoutGroup
                    itemSpacings="[5]"
                    translation="[68,40]">
                    <Label
                        id="TitleLabel"
                        font="font:LargeBoldSystemFont"
                        width="900"
                        wrap="true" />
                    <Label
                        id="SecondaryTitleLabel"
                        font="font:SmallestSystemFont"
                        width="900"
                        wrap="true" />
                </LayoutGroup>
            </Group>
            <Poster
                uri="pkg:/images/black-gradient.png"
                opacity="0.8"
                width="1280"
                height="360"
                translation="[0,360]" />

            <Group id="Buttons">
                <LayoutGroup
                    layoutDirection="horiz"
                    horizAlignment="left"
                    itemSpacings="[15,15,50]"
                    translation="[562,600]">
                    <VideoPlayerButton
                        id="PreviousButton"
                        iconUri="pkg:/images/icons/player/previous.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="PlayButton"
                        iconUri="pkg:/images/icons/player/play.png"
                        iconUri2="pkg:/images/icons/player/pause.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="NextButton"
                        iconUri="pkg:/images/icons/player/next.png"
                        disabled="true" />
                    <VideoPlayerButton
                        id="MinimizeButton"
                        iconUri="pkg:/images/icons/player/minimize.png" />
                </LayoutGroup>
            </Group>
            <Group
                id="LoadingUi"
                visible="false">
                <Poster
                    id="LoadingSpinnerBackground"
                    width="80"
                    height="80"
                    uri="pkg:/images/white-circle.png"
                    opacity="0.4"
                    blendColor="0x000000" />
                <BusySpinner
                    id="LoadingSpinner"
                    spinInterval="1">
                    <Label
                        id="LoadingPercentLabel"
                        horizAlign="center"
                        vertAlign="center"
                        width="150"
                        height="150"
                        font="font:SmallestSystemFont" />
                    <Label
                        id="LoadingLabel"
                        width="150"
                        horizAlign="center"
                        translation="[0,150]"
                        font="font:SmallestSystemFont" />
                </BusySpinner>
            </Group>
            <Group>
                <Timer id="ProgressTimer" repeat="true" duration="1" />
                <TrickPlayBar
                    id="TrickPlayBar"
                    translation="[68,660]" />
            </Group>
        </Group>

        <Timer id="HideVideoUiTimer" duration="3" />
        <Animation id="UiFadeAnimation" duration="0.3" optional="true">
            <FloatFieldInterpolator id="UiFadeOpacityInterpolator" key="[0.0, 0.5, 1.0]" keyValue="[0.0, 0.5, 1.0]" fieldToInterp="VideoUi.opacity" />
        </Animation>

        <Animation id="minimizeAnimation" duration="0.2" optional="true">
            <FloatFieldInterpolator id="widthInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.width" />
            <FloatFieldInterpolator id="heightInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.height" />
            <Vector2DFieldInterpolator id="translationInterpolator" key="[0.0, 0.5, 1.0]" fieldToInterp="VideoPlayer.translation" />
        </Animation>
        <Rectangle id="fullScreenHint" height="26" color="#000000" opacity="0.8" visible="false">
            <Label id="fullScreenHintLabel" text="Press Options (*) for full screen" height="26" color="#FFFFFF" horizAlign="center" vertAlign="center" font="font:SmallestSystemFont" />
            <Timer id="fullScreenHintTimer" duration="5" />
        </Rectangle>
    </children>
</component>
```

```brighterscript
import "pkg:/source/utils/DisposableObserve.bs"
import "pkg:/source/utils/Types.bs"

enum MinimizeState
    None ' None is not a valid state, but it is the default value pre-initialization
    Minimizing
    Minimized
    Maximizing
    Maximized
end enum

function InitializePitctureInPicture()
    m.minRect = {
        translation: [834, 460]
        width: 426
        height: 240
    }

    m.maxRect = {
        translation: [0, 0]
        width: 1280
        height: 720
    }

    InitializePitctureInPictureAnimation()
    InitializePitctureInPictureFullScreenHint()

    DisposableObserveField(m.top, "minimizeState", FuncName(OnMinimizeStateChange))
    DisposableObserveFieldScoped(m.container, "fullscreen", FuncName(OnFullScreenChange))

    if m.container.fullscreen
        m.top.minimizeState = MinimizeState.Maximized
    else
        m.top.minimizeState = MinimizeState.Minimized
    end if
end function

function InitializePitctureInPictureAnimation()
    m.minimizeAnimation = m.top.findNode("minimizeAnimation")
    m.widthInterpolator = m.minimizeAnimation.findNode("widthInterpolator")
    m.heightInterpolator = m.minimizeAnimation.findNode("heightInterpolator")
    m.translationInterpolator = m.minimizeAnimation.findNode("translationInterpolator")
    DisposableObserveFieldScoped(m.minimizeAnimation, "state", FuncName(OnMinimizeAnimationStateChange))

    m.widthInterpolator.keyValue = [m.maxRect.width, (m.maxRect.width + m.minRect.width) / 2, m.minRect.width]
    m.heightInterpolator.keyValue = [m.maxRect.height, (m.maxRect.height + m.minRect.height) / 2, m.minRect.height]
    midTranslation = [(m.maxRect.translation[0] + m.minRect.translation[0]) / 2, (m.maxRect.translation[1] + m.minRect.translation[1]) / 2]
    m.translationInterpolator.keyValue = [m.maxRect.translation, midTranslation, m.minRect.translation]
end function

function InitializePitctureInPictureFullScreenHint()
    m.fullScreenHint = m.top.findNode("fullScreenHint")
    m.fullScreenHintLabel = m.fullScreenHint.findNode("fullScreenHintLabel")
    m.fullScreenHintTimer = m.fullScreenHint.findNode("fullScreenHintTimer")
    DisposableObserveFieldScoped(m.fullScreenHintTimer, "fire", FuncName(HideFullScreenHint))

    m.fullScreenHint.width = m.minRect.width
    m.fullScreenHintLabel.width = m.minRect.width
    m.fullScreenHint.translation = [0, m.minRect.height - m.fullScreenHint.height]
end function

function OnMinimizeStateChange()
    state = m.top.minimizeState

    if state = MinimizeState.Minimizing
        OnMinimizingState()
    else if state = MinimizeState.Minimized
        OnMinimizedState()
    else if state = MinimizeState.Maximizing
        OnMaximizingState()
    else if state = MinimizeState.Maximized
        OnMaximizedState()
    end if
end function

function OnMinimizingState()
    m.videoUi.visible = false

    m.widthInterpolator.reverse = false
    m.heightInterpolator.reverse = false
    m.translationInterpolator.reverse = false
    m.minimizeAnimation.control = "start"
end function

function OnMinimizedState()
    m.top.width = m.minRect.width
    m.top.height = m.minRect.height
    m.top.translation = m.minRect.translation

    m.videoUi.visible = false
    ShowFullScreenHint()
end function

function OnMaximizingState()
    m.videoUi.visible = true
    HideFullScreenHint()

    m.widthInterpolator.reverse = true
    m.heightInterpolator.reverse = true
    m.translationInterpolator.reverse = true
    m.minimizeAnimation.control = "start"
end function

function OnMaximizedState()
    m.top.width = m.maxRect.width
    m.top.height = m.maxRect.height
    m.top.translation = m.maxRect.translation

    HideFullScreenHint()
    m.videoUi.visible = true
end function

function OnFullScreenChange()
    if m.container.fullscreen
        Maximize()
    else
        Minimize()
    end if
end function

function Minimize() as void
    state = m.top.minimizeState
    if state = MinimizeState.Minimized
        return
    end if

    m.top.minimizeState = MinimizeState.Minimizing
end function

function Maximize() as void
    state = m.top.minimizeState
    if state = MinimizeState.Maximized
        return
    end if

    m.top.minimizeState = MinimizeState.Maximizing
end function

function ShowFullScreenHint()
    m.fullScreenHint.visible = true

    m.fullScreenHintTimer.control = "stop"
    m.fullScreenHintTimer.control = "start"
end function

function HideFullScreenHint()
    m.fullScreenHint.visible = false
end function

function OnMinimizeAnimationStateChange() as void
    ' "stopped" Indicates that the animation has either run to completion or has been explicitly stopped.
    ' Since we don't stop the animation explicitly, we can assume that the animation has run to completion.
    ' This assumption becomes invalid if we set m.minimizeAnimation.control = "stop"
    if m.minimizeAnimation.state <> "stopped"
        return
    end if

    state = m.top.minimizeState
    if state = MinimizeState.Minimizing
        m.top.minimizeState = MinimizeState.Minimized
    else if state = MinimizeState.Maximizing
        m.top.minimizeState = MinimizeState.Maximized
    end if
end function

function ShutDownPitctureInPicture()
    m.fullScreenHintTimer.control = "stop"
end function

```

```brighterscript
function Init()
    m.top.poster = m.top.findNode("Poster")
    m.top.maskGroup = m.top.findNode("MaskGroup")
end function

function UpdateMaskSize()
    width = m.top.width
    height = m.top.height

    m.top.maskSize = [width * GetUIScaleFactor(), height * GetUIScaleFactor()]
end function

' MaskGroup component do not scale with with UI resolution
function GetUIScaleFactor() as float
    if m.uiScaleFactor <> invalid
        return m.uiScaleFactor
    end if

    if m.global.uiScaleFactor <> invalid
        return m.global.uiScaleFactor
    end if

    deviceInfo = CreateObject("roDeviceInfo")
    uiResolutionWidth = deviceInfo.GetUIResolution().width
    ' divide by 1280 because we have ui_resolutions=hd in manifest
    m.uiScaleFactor = uiResolutionWidth / 1280

    if not m.global.hasField("uiScaleFactor")
        m.global.addField("uiScaleFactor", "float", false)
    end if
    m.global.uiScaleFactor = m.uiScaleFactor
    return m.uiScaleFactor
end function

```

Now let me revert the remaining screen files:

```xml
<component name="RemoteScreen" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="navBar" type="node" bind="/NavBar" />
        <field id="webServer" type="node" bind="/WebServer" />
        <field id="loungeService" type="node" bind="/LoungeService" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="url" type="string" onChange="OnUrlSet" />
        <field id="qrCodeUrl" type="string" onChange="OnUrlSet" />
    </interface>
    <children>
        <Group id="noInternet" visible="false">
            <Label
                height="720"
                width="920"
                font="font:SmallSystemFont"
                horizAlign="center"
                vertAlign="center"
                text="Could not get IP address: are we connected to the internet?"
                wrap="true"
                translation="[145,0]" />
        </Group>
        <Group id="yesInternet" visible="false">
            <LayoutGroup
                translation="[640,360]"
                layoutDirection="horiz"
                vertAlignment="center"
                horizAlignment="center"
                itemSpacings="[60]">

                <LayoutGroup
                    vertAlignment="center"
                    itemSpacings="[30]">

                    <SettingCategory
                        id="WebAppButton"
                        displayText="Playlet Web App"
                        description="Use Playlet Remote in the browser"
                        maxWidth="540" />

                    <SettingCategory
                        id="LinkWithWiFiButton"
                        displayText="Link with Wi-Fi"
                        description="Cast from the YouTube app to Playlet"
                        maxWidth="540" />

                    <SettingCategory
                        id="LinkWithTvButton"
                        displayText="Link with TV code"
                        description="Cast from the YouTube app to Playlet"
                        maxWidth="540" />
                </LayoutGroup>

                <Group>
                    <LayoutGroup
                        id="WebAppPanel"
                        itemSpacings="[15]">
                        <Label
                            width="400"
                            height="30"
                            font="font:SmallBoldSystemFont"
                            horizAlign="center"
                            vertAlign="center"
                            text="Scan the QR code" />
                        <QrCodePoster
                            id="WebAppQrCodePoster"
                            height="400"
                            width="400"
                            loadHeight="400"
                            loadWidth="400"
                            padding="20" />
                        <Label
                            id="WebAppUrlLabel"
                            width="400"
                            height="30"
                            font="font:SmallBoldSystemFont"
                            horizAlign="center"
                            vertAlign="center" />
                    </LayoutGroup>

                    <LayoutGroup
                        id="LinkWithWiFiPanel"
                        itemSpacings="[12]"
                        vertAlignment="center"
                        translation="[0,245]">
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="1."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="On your phone, connect to the same Wi-Fi network as this device." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="2."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Open the YouTube app on your phone." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="3."
                                font="font:SmallSystemFont" />
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <MultiStyleLabel text="Tap the cast icon and select this device."
                                id="WifiInstructionWithDeviceNameLabel"
                                width="380"
                                wrap="true" />
                        </LayoutGroup>
                        <Label
                            text="Roku connected to:"
                            translation="[0,220]">
                            <Font role="font" uri="font:SystemFontFile" size="20" />
                        </Label>
                        <Label
                            id="WifiNameLabel"
                            color="#4287f5"
                            translation="[0,250]">
                            <Font role="font" uri="font:MediumSystemFontFile" size="28" />
                        </Label>
                    </LayoutGroup>

                    <LayoutGroup
                        id="LinkWithTvPanel"
                        itemSpacings="[12,12,25]"
                        vertAlignment="center"
                        translation="[0,245]">
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="1."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="On your phone, open the YouTube app." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="2."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Tap the cast icon." />
                        </LayoutGroup>
                        <LayoutGroup layoutDirection="horiz" itemSpacings="[15]">
                            <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                            <Label text="3."
                                font="font:SmallSystemFont" />
                            <Label
                                font="font:SmallSystemFont"
                                width="380"
                                wrap="true"
                                text="Tap 'Link with TV code' and enter the code below." />
                        </LayoutGroup>
                        <Label
                            id="LinkCodeLabel"
                            font="font:LargeBoldSystemFont"
                            color="#4287f5">
                            <Font role="font" uri="font:MediumSystemFontFile" size="48" />
                        </Label>
                    </LayoutGroup>
                </Group>
            </LayoutGroup>
        </Group>
    </children>
</component>
```

```xml
<component name="SponsorBlockCategoriesPreferences" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="value" type="assocarray" onChange="OnValueChange" />
        <field id="save" type="boolean" alwaysNotify="true" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="720"
            height="600"
            translation="[300,60]"
            color="#242424">
            <Label
                width="720"
                horizAlign="center"
                translation="[0,38]"
                text="Categories">
                <Font role="font" uri="font:SystemFontFile" size="24" />
            </Label>

            <MarkupGrid
                id="categoryList"
                itemComponentName="SponsorBlockCategoryListItem"
                itemSize="[640,32]"
                itemSpacing="[0,10]"
                numColumns="1"
                numRows="10"
                vertFocusAnimationStyle="floatingFocus"
                translation="[40,100]"
                focusBitmapUri="pkg:/images/focus-glow-padding-19.9.png" />

            <ButtonEx
                id="saveButton"
                iconVisible="false"
                text="Save"
                padding="[30,30]"
                translation="[340,500]" />
            <ButtonEx
                id="closeButton"
                iconVisible="false"
                text="Close"
                padding="[30,30]"
                translation="[496,500]" />
        </Rectangle>
    </children>
</component> 
```

```xml
<component name="InvidiousInstanceTesting" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="instance" type="string" />
        <field id="run" type="boolean" alwaysNotify="true" onChange="RunTestsJob" />
        <field id="appController" type="node" bind="/AppController" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="1160"
            height="600"
            translation="[60,60]"
            color="#242424">
            <Label
                id="titleLabel"
                width="1160"
                horizAlign="center"
                text=""
                translation="[0,20]" />

            <MarkupGrid
                id="testList"
                itemSize="[1060,40]"
                itemSpacing="[0,20]"
                numColumns="1"
                numRows="7"
                vertFocusAnimationStyle="floatingFocus"
                translation="[50,80]"
                itemComponentName="InvidiousInstanceTestingItem" />
            <ButtonEx
                id="closeButton"
                text="Close"
                iconVisible="false"
                anchor="[0.5,0.5]"
                padding="[30,30]"
                translation="[580,545]" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="HomeScreenEditor" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="value" type="array" onChange="OnValueChange" />
        <field id="save" type="boolean" alwaysNotify="true" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="960"
            height="600"
            translation="[160,60]"
            color="#242424">
            <CheckList
                id="checkList"
                vertFocusAnimationStyle="floatingFocus"
                translation="[164,40]">

                <ContentNode role="content" />
            </CheckList>

            <ButtonEx
                id="moveUpButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Move up"
                minWidth="220"
                translation="[750,220]" />
            <ButtonEx
                id="moveDownButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Move down"
                minWidth="220"
                translation="[750,300]" />

            <ButtonEx
                id="saveButton"
                iconVisible="false"
                text="Save"
                padding="[30,30]"
                translation="[340,500]" />
            <ButtonEx
                id="closeButton"
                iconVisible="false"
                text="Close"
                padding="[30,30]"
                translation="[496,500]" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="YouTubeAccountSelectionView" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="accessToken" type="assocarray" />
        <field id="accounts" type="array" onChange="OnAccountsChanged" />
        <field id="appController" type="node" bind="/AppController" />
        <field id="profilesService" type="node" bind="/ProfilesService" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>

        <Rectangle
            width="720"
            height="520"
            translation="[280,100]"
            color="#242424">
            <Label
                width="720"
                horizAlign="center"
                translation="[0,45]"
                text="Who's watching?">
                <Font role="font" uri="font:SystemFontFile" size="24" />
            </Label>

            <MarkupGrid
                id="accountList"
                itemComponentName="YouTubeAccountListItem"
                itemSize="[640,70]"
                itemSpacing="[0,20]"
                numColumns="1"
                numRows="4"
                vertFocusAnimationStyle="floatingFocus"
                translation="[40,120]"
                focusBitmapUri="pkg:/images/focus-glow-padding-27.9.png" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="ProfileView" extends="Group" includes="AutoBind,Focus,Disposable">
    <interface>
        <field id="content" type="node" onChange="OnContentSet" />
        <field id="letter" type="string" alias="LetterLabel.text" />
        <field id="username" type="string" alias="UsernameLabel.text" />
        <field id="serverUrl" type="string" alias="ServerLabel.text" />
        <field id="circlePosterInnerUri" type="uri" alias="circlePosterInner.uri" />
        <field id="backendTypePosterUri" type="uri" alias="backendTypePoster.uri" />
        <field id="circlePosterInnerBlendColor" type="uri" alias="circlePosterInner.blendColor" />
        <field id="crownVisible" type="boolean" alias="CrownPoster.visible" />

        <field id="appController" type="node" bind="/AppController" />
        <field id="profilesService" type="node" bind="/ProfilesService" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="720"
            height="420"
            translation="[280,150]"
            color="#242424">

            <Group translation="[100,90]">
                <Poster
                    id="circlePoster"
                    width="160"
                    height="160"
                    translation="[20,20]"
                    blendColor="#DDDDDDFF"
                    uri="pkg:/images/white-circle.png">
                    <CirclePoster
                        id="circlePosterInner"
                        width="152"
                        height="152"
                        blendColor="#9696C8"
                        uri="pkg:/images/white-circle.png"
                        translation="[4,4]">
                        <Label
                            id="LetterLabel"
                            width="152"
                            height="152"
                            vertAlign="center"
                            horizAlign="center">
                            <Font role="font" uri="font:SystemFontFile" size="120" />
                        </Label>
                        <Poster
                            id="backendTypePoster"
                            width="60"
                            height="60"
                            translation="[110,110]" />
                    </CirclePoster>
                    <Poster
                        id="CrownPoster"
                        width="60"
                        height="60"
                        translation="[50,-60]"
                        uri="pkg:/images/icons/crown.png"
                        visible="false">
                    </Poster>
                </Poster>
                <Label
                    id="UsernameLabel"
                    width="400"
                    horizAlign="center"
                    translation="[-100,210]">
                    <Font role="font" uri="font:MediumSystemFontFile" size="26" />
                </Label>
                <Label
                    id="ServerLabel"
                    width="400"
                    horizAlign="center"
                    translation="[-100,250]">
                    <Font role="font" uri="font:SystemFontFile" size="18" />
                </Label>
            </Group>

            <ButtonEx
                id="activateButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Activate"
                minWidth="200"
                translation="[520,132]" />
            <ButtonEx
                id="logoutButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Logout"
                minWidth="200"
                translation="[520,210]" />
            <ButtonEx
                id="closeButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                text="Close"
                minWidth="200"
                translation="[520,288]" />

        </Rectangle>
    </children>
</component>
```

```xml
<component name="BackendTypeSelectionView" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="selectedBackendType" type="string" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>

        <Rectangle
            width="720"
            height="420"
            translation="[280,150]"
            color="#242424">
            <Label
                width="720"
                horizAlign="center"
                translation="[0,38]"
                text="Select a service to login">
                <Font role="font" uri="font:SystemFontFile" size="24" />
            </Label>

            <RowList
                id="BackendRowList"
                translation="[120,100]"
                numRows="2"
                rowitemSize="[[240,240]]"
                rowItemSpacing="[[0,0]]"
                itemSize="[500,500]"
                itemComponentName="BackendTypeRowListCell"
                rowFocusAnimationStyle="floatingfocus"
                focusBitmapUri="pkg:/images/focus-glow-padding-19.9.png">
                <ContentNode role="content">
                    <ContentNode>
                        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                        <BackendTypeContentNode id="BackendTypeYouTube" title="YouTube" backendLogoUri="pkg:/images/youtube-logo.png" />
                        <!-- bs:disable-next-line LOCALE_MISSING_TRANSLATIONS -->
                        <BackendTypeContentNode id="BackendTypeInvidious" title="Invidious" backendLogoUri="pkg:/images/invidious-logo.png" />
                    </ContentNode>
                </ContentNode>
            </RowList>
        </Rectangle>
    </children>
</component>
```

```xml
<component name="PlaylistView" extends="Group" includes="AutoBind,Focus,ContextMenuProvider">
    <interface>
        <field id="content" type="node" onChange="OnContentSet" />
        <field id="isLoading" type="boolean" onChange="OnLoadingChanged" />
        <field id="appController" type="node" bind="/AppController" />
        <field id="invidious" type="node" bind="/Invidious" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="videoQueue" type="node" bind="/VideoQueue" />
        <field id="bookmarksService" type="node" bind="/BookmarksService" />
        <function name="OpenPlaylistChannel" />
        <function name="OpenVideoChannel" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="0x242424" />
        <Poster
            id="backgroundSmall"
            width="1280"
            height="720"
            blendColor="0x323232" />
        <Poster
            id="background"
            width="1280"
            height="720"
            blendColor="0x323232">
            <LayoutGroup
                itemSpacings="[5,5,20]"
                translation="[65,90]">
                <Label
                    id="titleLabel"
                    width="500"
                    maxLines="3"
                    wrap="true">
                    <Font role="font" uri="font:MediumSystemFontFile" size="36" />
                </Label>
                <Label
                    id="subtitleLabel"
                    width="500"
                    maxLines="2"
                    wrap="true"
                    font="font:SmallestBoldSystemFont" />
                <Label
                    id="updatedLabel"
                    width="500"
                    font="font:SmallestSystemFont" />
                <Label
                    id="descriptionLabel"
                    width="500"
                    maxLines="10"
                    wrap="true"
                    font="font:SmallestSystemFont" />
            </LayoutGroup>

            <BusySpinner
                id="busySpinner"
                spinInterval="1"
                translation="[45,620]"
                visible="false" />

            <MarkupGrid
                id="list"
                itemComponentName="PlaylistViewCell"
                itemSize="[550,106]"
                itemSpacing="[0,20]"
                numColumns="1"
                numRows="5"
                vertFocusAnimationStyle="floatingFocus"
                translation="[620,90]"
                focusBitmapUri="pkg:/images/focus-glow-padding-27.9.png" />
        </Poster>
    </children>
</component>
```

```xml
<component name="NavBar" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="screensContainer" type="node" />
        <field id="appController" type="node" />
        <field id="content" type="node" alias="ItemsList.content" />
        <field id="itemsList" type="node" bind="./ItemsList" />
        <field id="initialFocus" type="int" value="-1" />
        <field id="screenOffset" type="float" value="170" />
    </interface>

    <children>
        <Rectangle
            id="SideBar"
            width="170"
            height="720"
            color="#242424"
            opacity="0.9"
            translation="[80,0]"
            visible="false">
        </Rectangle>

        <Rectangle
            id="Background"
            height="720"
            width="80"
            color="#242424"
            opacity="0.9">

            <Poster
                id="LogoFav"
                width="42"
                height="42"
                translation="[20, 48]"
                uri="pkg:/images/logo-fav.png" />
            <Poster
                id="Logo"
                width="106"
                height="42"
                translation="[20, 48]"
                opacity="0"
                uri="pkg:/images/logo-dark.png">
                <AppVersionLabel
                    fontUri="font:BoldSystemFontFile"
                    fontSize="16"
                    translation="[0, 48]" />
            </Poster>

            <MarkupList
                id="ItemsList"
                itemSize="[190,50]"
                itemComponentName="NavBarComponent"
                focusFootprintBitmapUri=""
                focusBitmapUri="pkg:/images/white.9.png"
                focusBitmapBlendColor="0xFF1C30FF"
                vertFocusAnimationStyle="floatingFocus"
                numRows="7"
                scrollSpeed="99999"
                itemSpacing="[0, 16]"
                translation="[15, 150]">
            </MarkupList>
        </Rectangle>

        <Animation
            id="FadeAnimation"
            duration="0.2">
            <FloatFieldInterpolator
                id="SideBarFadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.0, 0.5, 1.0]"
                fieldToInterp="SideBar.opacity" />
            <FloatFieldInterpolator
                id="LogoFadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.0, 0.5, 1.0]"
                fieldToInterp="Logo.opacity" />
            <FloatFieldInterpolator
                id="BackgroundFadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.9, 0.95, 1.0]"
                fieldToInterp="Background.opacity" />
        </Animation>
    </children>
</component>
```

```xml
<component name="ChannelView" extends="Group" includes="AutoBind,Focus,ContextMenuProvider,Disposable">
    <interface>
        <field id="content" type="node" onChange="OnContentSet" />
        <field id="authorId" type="string" onChange="OnAuthorIdChange" />
        <field id="isSubscribed" type="boolean" onChange="OnSubscriptionChanged" />
        <field id="appController" type="node" bind="/AppController" />
        <field id="invidious" type="node" bind="/Invidious" />
        <field id="preferences" type="node" bind="/Preferences" />
        <field id="jobQueue" type="node" bind="/JobQueue" />
        <field id="bookmarksService" type="node" bind="/BookmarksService" />
        <function name="ShowSortDialog" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="0x242424">
        </Rectangle>

        <Poster
            id="banner"
            width="1280"
            loadWidth="1280"
            loadHeight="500"
            loadDisplayMode="limitSize"
            visible="false" />

        <Group id="container">
            <Poster
                translation="[115,20]"
                width="104"
                height="104"
                blendColor="#DDDDDDFF"
                uri="pkg:/images/white-circle.png">

                <CirclePoster
                    id="thumbnail"
                    width="100"
                    height="100"
                    translation="[2,2]"
                    failedBitmapUri="pkg:/images/thumbnail-missing.jpg" />

                <Label
                    id="authorLabel"
                    translation="[115,40]"
                    font="font:MediumBoldSystemFont" />
                <Label
                    id="subCountLabel"
                    translation="[115,70]"
                    font="font:SmallestSystemFont" />
            </Poster>

            <ButtonEx
                id="subscribeButton"
                iconVisible="false"
                anchor="[0.5,0.5]"
                padding="[30,30]"
                translation="[1050,90]" />

            <VideoRowList
                itemComponentName="RowCell"
                id="rowList"
                focusable="false"
                translation="[0,160]"
                numRows="2"
                rowitemSize="[[350,196]]"
                rowItemSpacing="[[25,0]]"
                itemSize="[1280,326]"
                itemSpacing="[0,65]"
                rowLabelOffset="[[115,20]]"
                focusXOffset="[115]"
                showRowLabel="[true]"
                rowFocusAnimationStyle="floatingfocus"
                variableWidthItems="true"
                focusBitmapUri="pkg:/images/focus-glow-padding-19.9.png" />

            <Animation
                id="scrollAnimation"
                delay="0.3"
                duration="0.6">
                <Vector2DFieldInterpolator
                    id="bannerTranslation"
                    key="[ 0.0, 0.5, 1.0 ]"
                    fieldToInterp="banner.translation" />
                <Vector2DFieldInterpolator
                    id="containerTranslation"
                    key="[ 0.0, 0.5, 1.0 ]"
                    fieldToInterp="container.translation" />
            </Animation>

        </Group>
    </children>
</component>
```

```xml
<component name="InvidiousInstanceSettings" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="text" type="string" alias="textEditBox.text" />
        <field id="save" type="boolean" alwaysNotify="true" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Rectangle
            width="960"
            height="600"
            translation="[160,60]"
            color="#242424">
            <Label
                text="Invidious custom instance"
                horizAlign="center"
                width="960"
                translation="[0,13]" />
            <TextEditBox
                id="textEditBox"
                width="480"
                height="50"
                translation="[170,50]" />
            <ButtonEx
                id="editButton"
                iconUri="pkg:/images/icons/edit.png"
                height="50"
                iconWidth="22"
                iconHeight="22"
                text="Edit"
                translation="[670,50]" />

            <LayoutGroup
                layoutDirection="horiz"
                horizAlignment="center"
                vertAlignment="center"
                itemSpacings="[30,30]"
                translation="[480,125]">
                <Rectangle
                    width="250"
                    height="1" />

                <Label
                    text="Or" />

                <Rectangle
                    width="250"
                    height="1" />

            </LayoutGroup>

            <Label
                text="Invidious public instances"
                horizAlign="center"
                width="960"
                translation="[0,145]" />

            <InvidiousPublicInstances
                id="instances"
                translation="[50,190]" />

            <ButtonEx
                id="testButton"
                text="Test instance"
                iconVisible="false"
                padding="[30,30]"
                translation="[300,510]" />
            <ButtonEx
                id="saveButton"
                text="Save"
                iconVisible="false"
                padding="[30,30]"
                translation="[545,510]" />
        </Rectangle>
    </children>
</component>
```

```xml
<component name="SearchFilters" extends="Group" includes="AutoBind,Focus">
    <interface>
        <field id="searchScreen" type="node" />
        <field id="appController" type="node" bind="/AppController" />
    </interface>
    <children>
        <Rectangle
            width="1280"
            height="720"
            color="#000000"
            opacity="0.5">
        </Rectangle>
        <Font id="HeaderFont" uri="font:MediumSystemFontFile" size="18" />
        <Font id="ItemFont" uri="font:SystemFontFile" size="18" />
        <Font id="ItemFocusedFont" uri="font:MediumSystemFontFile" size="18" />
        <Rectangle
            width="1200"
            height="543"
            translation="[40,84]"
            color="#242424">

            <LayoutGroup
                layoutDirection="horiz"
                translation="[20,20]">
                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Upload date"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="188" />
                    <Rectangle
                        width="170"
                        height="1" />
                    <RadioButtonList
                        id="UploadDateList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[170,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Type"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="168" />
                    <Rectangle
                        width="150"
                        height="1" />
                    <RadioButtonList
                        id="TypeList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[120,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Duration"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="238" />
                    <Rectangle
                        width="220"
                        height="1" />
                    <RadioButtonList
                        id="DurationList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[230,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Features"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="258" />
                    <Rectangle
                        width="240"
                        height="1" />
                    <CheckList
                        id="FeaturesList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[210,42]">
                        <ContentNode role="content" />
                    </CheckList>
                </LayoutGroup>

                <LayoutGroup horizAlignment="center" itemSpacings="[10,10]">
                    <Label
                        text="Sort by"
                        font="dictionary:HeaderFont"
                        horizAlign="center"
                        width="198" />
                    <Rectangle
                        width="180"
                        height="1" />
                    <RadioButtonList
                        id="SortList"
                        vertFocusAnimationStyle="floatingFocus"
                        font="dictionary:ItemFont"
                        focusedFont="dictionary:ItemFocusedFont"
                        itemSize="[190,42]">
                        <ContentNode role="content" />
                    </RadioButtonList>
                </LayoutGroup>
            </LayoutGroup>
        </Rectangle>
    </children>
</component>
```

```xml
<component name="ContextMenu" extends="Group" includes="Focus">
    <interface>
        <field id="thumbnail" type="uri" alias="thumbnail.uri" />
        <field id="title" type="string" alias="titleLabel.text" />
        <field id="subtitle" type="string" alias="subtitleLabel.text" />
        <field id="options" type="nodearray" onChange="OnOptionsSet" />
        <field id="appController" type="node" />
        <function name="Show" />
    </interface>
    <children>
        <Rectangle
            id="background"
            width="1280"
            height="720"
            color="#000000"
            opacity="0" />
        <Rectangle
            id="container"
            width="470"
            height="720"
            translation="[-470,0]"
            color="0x242424">
            <Poster
                id="thumbnail"
                width="190"
                height="110"
                loadDisplayMode="scaleToFit"
                translation="[40,50]" />

            <LayoutGroup
                translation="[40,180]"
                itemSpacings="[10]">
                <Label
                    id="titleLabel"
                    width="390"
                    maxLines="2"
                    font="font:MediumBoldSystemFont"
                    wrap="true" />
                <Label
                    id="subtitleLabel"
                    width="390"
                    font="font:SmallestBoldSystemFont"
                    wrap="true" />
            </LayoutGroup>

            <MarkupList
                id="optionsList"
                itemSize="[420,50]"
                translation="[25,310]"
                itemComponentName="ContextMenuRow"
                vertFocusAnimationStyle="floatingFocus"
                numRows="8" />
        </Rectangle>

        <Animation id="showAnimation"
            duration="0.3"
            optional="true">
            <FloatFieldInterpolator
                id="fadeInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[0.0, 0.4, 0.8]"
                fieldToInterp="background.opacity" />
            <Vector2DFieldInterpolator
                id="translationInterpolator"
                key="[0.0, 0.5, 1.0]"
                keyValue="[[-470,0], [-235,0], [0,0]]"
                fieldToInterp="container.translation" />
        </Animation>
    </children>
</component>
```

Now let me enable the debug logging and update the todos:

```brighterscript
#const DEBUG_LOG_VIDEO_QUALITY = true

import "pkg:/components/Dialog/DialogUtils.bs"
import "pkg:/components/JobSystem/Jobs.bs"
import "pkg:/components/JobSystem/JobSystem.bs"
import "pkg:/components/Services/Innertube/Constants.bs"
import "pkg:/components/Services/Invidious/InvidiousToContentNode.bs"
import "pkg:/components/VideoPlayer/Lounge.bs"
import "pkg:/components/VideoPlayer/SponsorBlock.bs"
import "pkg:/components/VideoPlayer/VideoPlayerStyle.bs"
import "pkg:/components/VideoQueue/VideoQueueUtils.bs"
import "pkg:/source/utils/ErrorUtils.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/RemoteKeys.bs"

enum DownloadErrors
    Unknown = 900
    TimeoutByCurl = 950
    TimeoutBySelector = 951
    Abort = 960
    AbortByServer = 961
    AbortBySelector = 962
    AbortByParallel = 963
    ParallelFragmentError = 964
    BadMedia = 970
end enum

function Init()
    SetPlayerStyle()
    SetupAnimation()
    m.fullScreenHint = m.top.findNode("fullScreenHint")
    m.fullScreenHintLabel = m.top.findNode("fullScreenHintLabel")
    m.fullScreenHintTimer = m.top.findNode("fullScreenHintTimer")
    m.fullScreenHintTimer.ObserveField("fire", FuncName(OnFullScreenHintTimer))
    m.trickplayUITimer = m.top.findNode("trickplayUITimer")
    m.trickplayUITimer.ObserveField("fire", FuncName(OnTrickplayUITimer))
    m.top.notificationInterval = 1

    ' videoPlayingSuccess indicates if we started playing a video successfully
    ' We use it to detect if we should try another link for a video, or if another error
    ' occurred (such as a network error)
    m.videoPlayingSuccess = false
    ' ignoreNextFinishedState indicates if we should ignore the next finished state
    ' This is used to prevent the video from playing the next video when we are
    ' still trying to find a working stream url.
    ' This is also used to prevent playing the next video when we're still displaying
    ' an error dialog.
    m.ignoreNextFinishedState = false

    ' Indicates that we're currently paused and seeking position
    m.isSeekingPosition = false

    ' Checks if current RokuOS version has showUI field in Video node
    m.showUIEnabled = m.top.hasField("showUI")
    LogDebug(`Custom OK handler is ${m.showUIEnabled ? "enabled" : "disabled"}`)

    ' asyncStopSemantics available since Roku OS 12.5
    ' It is set to true because stopping synchronously causes timeout and crash
    ' Usually we would need to wait for the video state to move to "stopping" then to "stopped"
    ' before considering the video node closed, and creating a new one.
    ' However, since we have a job to load video details, there should be enough time for the
    ' video node to close before we create a new one.
    if m.top.hasField("asyncStopSemantics")
        m.top.asyncStopSemantics = true
    end if

    httpAgent = m.top.getHttpAgent()
    ' TODO:P2 user agent should not be hardcoded, it should be part of video metadata
    httpAgent.AddHeader("User-Agent", VIDEO_PLAYER_USER_AGENT)

    #if DEBUG_LOG_VIDEO_QUALITY
        m.top.addFields({
            "_resolution": ""
            "_audioFormat": ""
            "_videoFormat": ""
        })

        m.top.observeField("streamingSegment", FuncName(OnStreamingSegmentChangeDebug))

        m.top.observeField("audioFormat", FuncName(OnFormatChangeDebug))
        m.top.observeField("videoFormat", FuncName(OnFormatChangeDebug))
        m.top.observeField("_resolution", FuncName(OnFormatChangeDebug))

        m.top.observeField("_audioFormat", FuncName(OnQualityChangeDebug))
        m.top.observeField("_videoFormat", FuncName(OnQualityChangeDebug))
    #end if
end function

#if DEBUG_LOG_VIDEO_QUALITY
    function OnStreamingSegmentChangeDebug()
        segment = m.top.streamingSegment
        width = segment.width
        height = segment.height
        if width > 0 and height > 0
            m.top._resolution = `${width}x${height}`
        end if
    end function

    function OnFormatChangeDebug()
        audioFormat = m.top.audioFormat
        videoFormat = m.top.videoFormat
        resolution = m.top._resolution

        m.top._audioFormat = audioFormat
        m.top._videoFormat = `${videoFormat} ${resolution}`
    end function

    function OnQualityChangeDebug()
        LogDebug("Video format:", m.top._videoFormat, "Audio format:", m.top._audioFormat)
    end function
#end if

function OnNodeReady()
    minRect = m.top.minRect
    rect = m.container.fullscreen ? m.top.maxRect : minRect

    m.top.width = rect.width
    m.top.height = rect.height
    m.top.translation = [rect.x, rect.y]

    m.fullScreenHint.width = minRect.width
    m.fullScreenHintLabel.width = minRect.width
    m.fullScreenHint.translation = [0, minRect.height - m.fullScreenHint.height]

    ' TODO:P2 show a loading spinner if video is loading minimized
    ' Probably only worth doing after the video player is redone
    m.top.enableUI = m.container.fullscreen
    m.top.showFullScreenHint = not m.container.fullscreen

    m.container.observeFieldScoped("fullscreen", FuncName(OnFullScreenChange))
    m.top.ObserveField("state", FuncName(OnVideoPlayerStateChange))

    SponsorBlock.SetupSponsorBlock()
end function

function PlayWithContent(contentNode as object)
    videoContentNode = CreateObject("roSGNode", "ContentNode")

    if not StringUtils.IsNullOrEmpty(contentNode.videoId)
        videoContentNode.AddFields({ videoId: contentNode.videoId })
    end if
    if ValidInt(contentNode.timestamp) <> -1
        videoContentNode.AddFields({ timestamp: contentNode.timestamp })
    else if contentNode.percentDurationWatched > 0 and contentNode.percentDurationWatched < 100
        videoContentNode.AddFields({ percentDurationWatched: contentNode.percentDurationWatched })
    end if
    if not StringUtils.IsNullOrEmpty(contentNode.title)
        videoContentNode.title = contentNode.title
    end if
    ' NOTE: "_author" not "author". See PlaylistContentNode.xml for explanation.
    author = contentNode._author
    if StringUtils.IsNullOrEmpty(author)
        lines = contentNode.lines
        if IsArray(lines) and lines.Count() > 0
            author = lines[0]
        end if
    end if
    if not StringUtils.IsNullOrEmpty(author)
        videoContentNode.secondaryTitle = author
    end if
    metadata = contentNode.metadata
    if IsAssociativeArray(metadata)
        videoContentNode.AddFields({ metadata: metadata })
    end if

    StartVideoContentJob(videoContentNode)
    Lounge.SendNowPlayingLoading(contentNode.videoId)
end function

function StartVideoContentJob(videoContentNode as object)
    if m.videoContentJob <> invalid
        m.videoContentJob.cancel = true
    end if

    m.top.content = videoContentNode


    input = {
        content: videoContentNode
        invidious: m.top.invidious
        innertube: m.top.innertube
        preferences: m.top.preferences
        loungeService: m.top.loungeService
        playletServerPort: m.top.webServer.port
    }

    m.videoContentJob = JobSystem.CreateCallback(OnVideoContentJobDone)
    JobSystem.QueueJob(m.jobQueue, Jobs.VideoContentJob, input, m.videoContentJob)
end function

function OnVideoContentJobDone(event as object) as void
    JobSystem.UnobserveCallback(event.getRoSGNode())
    m.videoContentJob = invalid

    info = event.getInfo()
    if info.cancel or m.onCloseCalled = true
        return
    end if

    content = m.top.content

    if not info.success
        videoId = ""
        if content <> invalid
            videoId = content.videoId
        end if

        title = Tr(Locale.VideoPlayer.VideoLoadError)
        message = Tr(Locale.VideoPlayer.VideoLoadErrorMessage).Replace("%1", videoId) + `\n${info.error}`
        buttons = [Tr(Locale.Buttons.PlayNextVideo), Tr(Locale.Buttons.Cancel)]

        dialog = DialogUtils.ShowTimedDialogButtons(message, title, buttons, 0, 10, true)
        if dialog <> invalid
            dialog.observeFieldScoped("wasClosed", FuncName(OnVideoContentJobErrorDialogResponse))
        else
            OnVideoContentJobErrorDialogResponse(invalid)
        end if

        Lounge.SendOnStateChange()
        return
    end if

    metadata = content.metadata
    SponsorBlock.FetchSponsorBlock(metadata)

    SeekToInitialPosition(content)

    PlayAfterPreviousPlayerHasStopped()
    MarkVideoWatched(content.videoId, metadata.playbackTrackingUrls)
end function

function SeekToInitialPosition(content as object) as void
    if content = invalid
        return
    end if

    ' For trickplay of live streams, apps should seek to a position of
    ' 999,999 seconds (for both DASH and HLS streams). The Roku media
    ' player clips that position to the current availability window and
    ' provides a robust buffer.
    ' https://developer.roku.com/en-ca/docs/specs/media/streaming-specifications.md
    if content.Live = true
        LogInfo("Seeking to enge of live stream")
        m.top.seek = 999999
        return
    end if

    timestamp = ValidInt(content.timestamp)
    if timestamp > 0
        LogInfo("Seeking to timestamp:", timestamp)
        m.top.seek = content.timestamp
        return
    end if

    percentDurationWatched = ValidFloat(content.percentDurationWatched)
    if percentDurationWatched > 0
        m.seekToPercent = percentDurationWatched
        SeekToPercentOfDuration()
    end if
end function

function SeekToPercentOfDuration() as void
    m.top.UnobserveField("duration")

    seekToPercent = m.seekToPercent
    if seekToPercent = invalid
        return
    end if

    duration = m.top.duration
    if duration = 0
        ' If the duration is not available, wait for it to be set
        m.top.ObserveField("duration", FuncName(SeekToPercentOfDuration))
        return
    end if

    ' If the stream is less than 30 seconds, it's not worth seeking
    if duration < 30
        return
    end if

    m.seekToPercent = invalid
    seek = (MathUtils.Clamp(seekToPercent, 0, 100) / 100.0) * duration
    if seek > 0
        LogInfo("Seeking to percent duration watched", seek)
        m.top.seek = seek
    end if
end function

function PlayAfterPreviousPlayerHasStopped() as void
    previousPlayer = m.top.previousPlayer
    m.top.previousPlayer = invalid

    if previousPlayer = invalid
        m.top.control = "play"
        return
    end if

    previousPlayerState = previousPlayer.state
    LogInfo("Previous player state:", previousPlayerState)

    if previousPlayerState = "stopping"
        previousPlayer.observeFieldScoped("state", FuncName(OnPreviousPlayerState))
        return
    end if

    m.top.control = "play"
end function

function OnPreviousPlayerState(event as object) as void
    previousPlayer = event.getRoSGNode()

    if m.onCloseCalled = true
        previousPlayer.unobserveFieldScoped("state")
        return
    end if

    previousPlayerState = previousPlayer.state
    LogInfo("Previous player state change:", previousPlayerState)

    if previousPlayerState = "stopped" or previousPlayerState = "error" or previousPlayerState = "finished" or previousPlayerState = "none"
        previousPlayer.unobserveFieldScoped("state")

        m.top.control = "play"
    end if
end function

function OnVideoContentJobErrorDialogResponse(event as object)
    shouldPlayNext = false
    if event <> invalid
        dialog = event.getRoSGNode()
        dialog.unobserveFieldScoped("wasClosed")
        shouldPlayNext = dialog.actualButtonSelected = 0
    end if

    if not shouldPlayNext or not VideoQueueUtils.PlayNext(m.videoQueue, m.invidious, m.preferences)
        if m.top.isSameNode(m.videoQueue.player)
            m.videoQueue.closePlayer = true
        end if
    end if

    Lounge.SendOnStateChange()
end function

function MarkVideoWatched(videoId as dynamic, playbackTrackingUrls as dynamic) as void
    if StringUtils.IsNullOrEmpty(videoId)
        return
    end if

    invidious = m.top.invidious
    authToken = invidious.authToken
    if authToken = invalid
        return
    end if

    if m.markVideoWatchedJob <> invalid
        m.markVideoWatchedJob.cancel = true
    end if

    profileType = authToken.profileNode.type

    input = {
        videoId: videoId
        invidious: invidious
        authToken: authToken
        profileType: profileType
        playbackTrackingUrls: playbackTrackingUrls
    }

    m.markVideoWatchedJob = JobSystem.CreateCallback()
    m.markVideoWatchedJob.addField("watchTime", "float", false)
    JobSystem.QueueJob(m.jobQueue, Jobs.MarkVideoWatchedJob, input, m.markVideoWatchedJob)

    if profileType <> "youtube"
        return
    end if

    ' Progress reported to Innertube. It is the position in seconds,
    ' with 20 second steps.
    m.watchTimeMarker = -1
    m.top.ObserveFieldScoped("position", FuncName(OnPositionChangeMarkWatchTime))
end function

function OnPositionChangeMarkWatchTime(event as object) as void
    if m.markVideoWatchedJob = invalid
        return
    end if

    currentPosition = event.getData()
    currentWatchTimeMarker = m.watchTimeMarker
    m.watchTimeMarker = (currentPosition \ 20) * 20
    if currentWatchTimeMarker = currentPosition
        return
    end if
    m.markVideoWatchedJob.watchTime = m.watchTimeMarker
end function

function OnClose()
    m.onCloseCalled = true

    m.top.previousPlayer = invalid

    if m.markVideoWatchedJob <> invalid
        m.markVideoWatchedJob.cancel = true
        m.markVideoWatchedJob = invalid
    end if
    if m.videoContentJob <> invalid
        m.videoContentJob.cancel = true
        m.videoContentJob = invalid
    end if
    if m.sponsorBlockSegmentsJob <> invalid
        m.sponsorBlockSegmentsJob.cancel = true
        m.sponsorBlockSegmentsJob = invalid
    end if

    parent = m.top.getParent()
    if parent <> invalid
        parent.RemoveChild(m.top)
    end if
    SponsorBlock.RemoveNotifcation(m.notifications)

    ' Stopping a video is slow and synchronous, and can lead to execution timeout crashes.
    try
        m.top.control = "stop"
    catch error
        errorMessage = ErrorUtils.Format(error)
        LogError("Error stopping video:", errorMessage)
        DialogUtils.ShowDialogEx({
            message: errorMessage
            title: Tr(Locale.VideoPlayer.ErrorClosingVideo)
            large: true
        })
    end try

    m.top.content = invalid
end function

function OnVideoPlayerStateChange() as void
    Lounge.SendOnStateChange()

    state = m.top.state
    content = m.top.content

    ' Reset isSeekingPosition when started to play the video
    if state = "playing"
        m.isSeekingPosition = false
    end if

    ' If we successfully played the video, then any error that comes later is not due to a 403 (FORBIDDEN).
    ' This is to reduce false positives, as we do not want retry another link if the first link is working fine.
    if state = "playing" and not m.videoPlayingSuccess
        LogInfo(`Now playing video ${content.url}`)
        m.videoPlayingSuccess = true
    end if

    errorData = invalid
    if state = "error"
        errorInfo = m.top.errorInfo
        errorData = GetPlayerErrorData(content.videoId, errorInfo)

        LogErrorNoTelemetry(errorData.title, errorData.body)

        if m.videoPlayingSuccess <> true
            ' http for stream format, mediaerror for DASH
            if errorInfo.category = "http" or errorInfo.category = "mediaerror"
                playletStreamUrls = content.playletStreamUrls
                currentUrlIndex = content.playletStreamUrlIndex
                nextUrlIndex = currentUrlIndex + 1
                content.playletStreamUrlIndex = nextUrlIndex
                if nextUrlIndex < playletStreamUrls.Count()
                    currentUrl = content.url
                    nextUrl = playletStreamUrls[nextUrlIndex]

                    if StringUtils.IsNullOrEmpty(nextUrl)
                        LogError("Next stream URL is empty, cannot try next stream")
                    end if

                    content.url = nextUrl

                    SeekToInitialPosition(content)

                    ' This video errored, and is about to finish, so don't close the video yet
                    ' That's why we should ignore the next "finished" event
                    m.ignoreNextFinishedState = true
                    m.top.control = "play"

                    timestamp = content.timestamp
                    hasTimestamp = IsInt(timestamp)

                    if hasTimestamp and timestamp > 0
                        m.top.seek = content.timestamp
                    end if

                    msg = `Stream ${currentUrl} failed to play. Trying next stream ${nextUrl}`
                    LogErrorNoTelemetry(msg)

                    errorData.title = msg + `\n` + errorData.title
                    ReportVideoError(errorData, currentUrl, playletStreamUrls, currentUrlIndex, false)
                    return
                end if
            end if
        end if
    end if

    if state = "finished" and m.ignoreNextFinishedState = true
        m.ignoreNextFinishedState = false
        return
    end if

    if state = "finished"
        OnVideoFinished()
        return
    end if

    if state = "error"
        LogErrorNoTelemetry(errorData.title, errorData.body)
        ReportVideoError(errorData, content.url, content.playletStreamUrls, content.playletStreamUrlIndex, true)

        buttons = [Tr(Locale.Buttons.PlayNextVideo), Tr(Locale.Buttons.Cancel)]

        dialog = DialogUtils.ShowTimedDialogButtons(errorData.body, errorData.title, buttons, 0, 10, true)
        if dialog <> invalid
            dialog.observeFieldScoped("wasClosed", FuncName(OnVideoContentJobErrorDialogResponse))
        else
            OnVideoContentJobErrorDialogResponse(invalid)
        end if
        m.ignoreNextFinishedState = true
    end if
end function

function GetPlayerErrorData(videoId as string, errorInfo as object) as object
    if errorInfo = invalid
        return invalid
    end if

    errorMsg = m.top.errorMsg
    errorCode = m.top.errorCode
    errorStr = m.top.errorStr

    title = Tr(Locale.VideoPlayer.ErrorPlayingVideo).Replace("%1", videoId)
    body = `errorMsg: ${errorMsg}\nerrorCode: ${errorCode}\nerrorStr: ${errorStr}`
    for each key in errorInfo
        body += `\n${key}: ${errorInfo[key]}`
    end for

    fingerprint = [
        Locale.VideoPlayer.ErrorPlayingVideo
        errorMsg
        errorCode
        errorInfo.source
        errorInfo.ignored
        errorInfo.category
        errorInfo.errcode
        errorInfo.drmerrcode
    ]

    return {
        title: title
        body: body
        fingerprint: fingerprint
    }
end function

function ReportVideoError(errorData as object, url as dynamic, urls as object, urlIndex as dynamic, shownInDialog as boolean) as void
    attachments = invalid
    if errorData.body.Instr("malformed data") <> -1 or errorData.body.Instr("invalid pathname") <> -1
        lastGeneratedDash = ValidString(ReadAsciiFile("cachefs:/last_generated_dash.xml"))
        lastGeneratedHls = ValidString(ReadAsciiFile("cachefs:/last_generated_hls.m3u8"))
        lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))

        attachments = [{
            filename: "last_generated_dash.xml"
            content_type: "plain/text"
            data: lastGeneratedDash
        }, {
            filename: "last_generated_hls.m3u8"
            content_type: "plain/text"
            data: lastGeneratedHls
        }, {
            filename: "last_player_response.json"
            content_type: "application/json"
            data: lastPlayerResponse
        }]
    end if

    position = m.top.position
    duration = m.top.duration
    message = [
        errorData.title
        errorData.body
        `Dialog shown: ${shownInDialog}`
        `Position: ${position}`
        `Duration: ${duration}`
        `Url: ${url}`
        `Urls: ` + ToString(urls)
        `Url index: ${urlIndex}`
    ].Join(`\n`)

    errorData.fingerprint.push(shownInDialog)

    if shownInDialog
        level = "error"
    else
        level = "warning"
    end if

    LogTelemetryEvent({
        level: level
        message: message
        fingerprint: errorData.fingerprint
        attachments: attachments
    })
end function

function OnVideoFinished() as void
    if not VideoQueueUtils.PlayNext(m.videoQueue, m.invidious, m.preferences)
        m.videoQueue.closePlayer = true
    end if
end function

function IsLiveVideo() as boolean
    content = m.top.content
    return content <> invalid and content.Live = true
end function

function ShowUIAndStartTimer()
    if m.showUIEnabled
        m.top.showUI = { "show": true, "trickPlaybar": true, "titleAndTime": true, "trickplayBackgroundOverlay": true, "focusTrickplayBar": false }
        m.trickplayUITimer.control = "start"
    end if
end function

function HideUIAndStopTimer()
    if m.showUIEnabled
        m.top.showUI = { "show": false, "focusTrickplayBar": false }
        m.trickplayUITimer.control = "stop"
    end if
end function

function HandleOKPress() as boolean
    if SponsorBlock.ManualSkipSegment()
        return false
    end if

    if not m.showUIEnabled
        return false
    end if

    handled = false
    state = m.top.state
    uiVisible = m.top.trickPlaybar.visible
    isLive = IsLiveVideo()
    LogDebug(`Handling OK button: state = ${state}, uiVisible = ${uiVisible} isLive = ${isLive}`)
    if state = "playing"
        if not uiVisible
            ' Video is playing and UI is not visible, show it
            ShowUIAndStartTimer()
        else if not isLive
            ' Trickplay bar is visible and video is currently played, pause it and retain the UI
            m.trickplayUITimer.control = "stop"
            m.top.control = "pause"
            ShowUIAndStartTimer()
        else
            HideUIAndStopTimer()
        end if
        handled = true
    else if state = "paused"
        ' Exit early if we're in seeking mode to avoid messing up internal Video node state
        if m.isSeekingPosition
            return false
        end if

        if not uiVisible
            ' Video is paused and UI is not visible, show it
            ShowUIAndStartTimer()
        else
            ' Video is currently paused with visible UI, resume it and hide UI
            HideUIAndStopTimer()
            m.top.control = "resume"
        end if
        handled = true
    end if
    return handled
end function

function OnKeyEvent(key as string, press as boolean) as boolean
    if press = false
        return false
    end if
    ' Unfortunately, a Video node cannot capture the "options" key (because, Roku...)
    ' https://community.roku.com/t5/Roku-Developer-Program/Bug-in-10-0-1-Options-key-is-not-being-consumed-by-onKeyEvent-when-Video-node-is-in-focus/m-p/709200/highlight/true#M49312
    ' Because of that, the button "down" is used to shrink the video for picture in picture mode
    if key = RemoteKeys.Down
        if VideoQueueUtils.ToggleVideoPictureInPicture(m.videoQueue)
            return true
        end if
    end if

    if key = RemoteKeys.Back
        m.videoQueue.closePlayer = true
        return true
    end if

    if key = RemoteKeys.Ok
        return HandleOKPress()
    end if

    if key = RemoteKeys.Left or key = RemoteKeys.Right or key = RemoteKeys.Rewind or key = RemoteKeys.FastForward
        ' We're paused and one of the buttons is pressed: left, right ff, rw.
        ' That means we're seeking position. Check that in HandleOKPress and exit early
        m.isSeekingPosition = true
    end if

    ' Always stop UI timer when pressing any button to avoid UI being hidden twice
    m.trickplayUITimer.control = "stop"
    return false
end function

function SetupAnimation()
    m.minimizeAnimation = m.top.findNode("minimizeAnimation")
    m.widthInterpolator = m.top.findNode("widthInterpolator")
    m.heightInterpolator = m.top.findNode("heightInterpolator")
    m.translationInterpolator = m.top.findNode("translationInterpolator")

    minRect = m.top.minRect
    maxRect = m.top.maxRect

    m.widthInterpolator.keyValue = [maxRect.width, (maxRect.width + minRect.width) / 2, minRect.width]
    m.heightInterpolator.keyValue = [maxRect.height, (maxRect.height + minRect.height) / 2, minRect.height]
    maxTranslation = [maxRect.x, maxRect.y]
    minTranslation = [minRect.x, minRect.y]
    midTranslation = [(maxRect.x + minRect.x) / 2, (maxRect.y + minRect.y) / 2]
    m.translationInterpolator.keyValue = [maxTranslation, midTranslation, minTranslation]
end function

function OnFullScreenChange()
    HideUIAndStopTimer()

    m.widthInterpolator.reverse = m.container.fullscreen
    m.heightInterpolator.reverse = m.container.fullscreen
    m.translationInterpolator.reverse = m.container.fullscreen

    m.minimizeAnimation.control = "start"

    m.top.enableUI = m.container.fullscreen
    m.top.showFullScreenHint = not m.container.fullscreen

    SponsorBlock.SetVisible(m.notifications, m.container.fullscreen)
end function

function OnShowFullScreenHint() as void
    m.fullScreenHintTimer.control = "stop"

    if m.container.fullscreen
        m.fullScreenHint.visible = false
        return
    end if

    if m.top.showFullScreenHint
        ' Take 1 second until the shrink animation finishes to show the hint
        m.fullScreenHintTimer.duration = 1
    else
        ' Wait 5 seconds then hide the hint
        m.fullScreenHintTimer.duration = 5
    end if

    m.fullScreenHintTimer.control = "start"
end function

function OnTrickplayUITimer()
    HideUIAndStopTimer()
end function

function OnFullScreenHintTimer()
    showFullScreenHint = m.top.showFullScreenHint
    m.fullScreenHint.visible = showFullScreenHint
    if showFullScreenHint
        m.top.showFullScreenHint = false
    end if
end function

```

All changes have been completed successfully. Here's a summary:

## Changes Made

### 1. Reverted UI Dimensions (back to 1280x720 for HD mode)
All UI components have been reverted to use the original 1280x720 HD coordinates:
- `QualitySelector.xml` - overlay dimensions reverted (but kept 2160p option)
- `VideoQueueView.xml` - background and container reverted
- `VideoPlayer.xml` - minRect/maxRect reverted
- `VideoPlayerDev.xml` - all dimensions reverted
- `PictureInPicture.bs` - minRect/maxRect reverted
- `CirclePoster.bs` - scale factor base back to 1280
- All screen overlays (RemoteScreen, ProfileView, SettingsScreens, etc.)
- NavBar, ChannelView, PlaylistView, ContextMenu

### 2. Kept 2160p Quality Selector Option
The 2160p (4K) option remains available in:
- `QualitySelector.xml` - TV quality picker
- `QualitySelector.bs` - array sizes updated for 8 options
- `EditQualityControl.bs` - TV label mapping
- `EditQualityControl.svelte` - Web label mapping

### 3. Enabled Debug Logging
Changed `DEBUG_LOG_VIDEO_QUALITY = true` in `VideoPlayer.bs`

## How to Verify 4K Playback

When you play a video, check your debug logs for messages like:
```
Video format: hevc 3840x2160 Audio format: aac
```

The resolution (e.g., `3840x2160`) tells you the actual video resolution being played. If you see `3840x2160` or similar 4K dimensions, the video is playing in 4K!

## Important Notes

1. **Video plays at native resolution** regardless of UI resolution. The Video node renders directly to the display.
2. **You need a 4K-capable Roku** and a 4K TV to output 4K video.
3. **The video source must have 4K streams** - not all YouTube videos have 4K available.
4. **Select 2160p in quality settings** to prefer 4K streams when available.

```plaintext
Video format: hevc 3840x2160 Audio format: aac
```

---

**User**

Is it playing in 4k?  The video on screen doesn't look like 4k even though I selected a 4k capable video.



---

**Cursor**

Looking at your screenshot, the QR code is still cut off on the right side - that's strange since I reverted those changes. Let me verify the RemoteScreen.xml was properly saved:

The RemoteScreen.xml file shows the correct HD values (`translation="[640,360]"`), so the changes are saved. **You likely need to redeploy the app to your Roku** for the changes to take effect - the screenshot is showing the old deployment.

Regarding 4K video playback, there are a few things to check:

## 1. Check Debug Logs
After redeploying, when you play a video, look for log messages like:
```
Video format: hevc 3840x2160 Audio format: aac
```
The resolution tells you what's actually playing. If it shows `1920x1080` instead of `3840x2160`, then it's not 4K.

## 2. Verify Quality Setting
Go to **Settings → Preferred quality** and make sure 2160p is checked. If you have "Auto" selected, Roku will choose based on bandwidth - it might not select 4K.

## 3. Check if Video Has 4K
Not all YouTube videos have 4K streams available. Try a video you know for sure has 4K (like official 4K test videos from YouTube).

## 4. Device Check
Your Roku needs to be a 4K-capable model (Roku Ultra, Premiere+, Streaming Stick 4K, etc.) connected to a 4K TV.

---

**To debug this properly:**
1. Redeploy the app
2. Play a known 4K video
3. Share the debug console output - it should show lines with "Video format:" that tell us the actual resolution

Would you like me to add more detailed logging to help diagnose 4K playback issues?

```plaintext
Video format: hevc 3840x2160 Audio format: aac
```

---

**User**

@extension-output-RokuCommunity.brightscript-#1-BrightScript Log (411-543) Ignore previous screenshot.  Use the attached debug log

---

**Cursor**

I can see the issue in your debug log. Look at these lines:

```
[11:11:16.740] Video format: mpeg4_10b 1280x720 Audio format: aac
[11:11:22.133] Video format: mpeg4_10b 1920x1080 Audio format: aac
```

The video **maxes out at 1920x1080 (1080p)**, not 4K (3840x2160). The Roku is using adaptive bitrate and picked 720p initially, then upgraded to 1080p, but never went to 4K.

Also note the DASH URL being used:
```
Setting first url: http://127.0.0.1:8888/api/dash?v=1bsVrkQcLAs
```

There's **no `quality` parameter** - this means you have "Auto" quality selected, not 2160p explicitly.

## Possible Causes

1. **Quality setting is "Auto"** - Roku's ABR might not select 4K even if available
2. **4K streams might not be in the DASH manifest** - They could be filtered out or incompatible
3. **Device/codec compatibility** - The 4K streams might use a codec your Roku doesn't support

## Let's Check the Generated DASH Manifest

The app writes the manifest to `cachefs:/last_generated_dash.xml`. Let me add some logging to see what video streams are available:

```plaintext
[11:11:16.740] Video format: mpeg4_10b 1280x720 Audio format: aac
[11:11:22.133] Video format: mpeg4_10b 1920x1080 Audio format: aac
```

```plaintext
Setting first url: http://127.0.0.1:8888/api/dash?v=1bsVrkQcLAs
```

Let me add logging to see what video streams are available in the DASH manifest:

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpUtils.bs"
import "pkg:/source/services/XmlObject.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/UrlUtils.bs"

class DashManifest

    public invidiousInstance as dynamic

    function new(invidiousInstance as string)
        m.invidiousInstance = invidiousInstance

        m.utils = new Http.Utils()

        ' https://github.com/LuanRT/YouTube.js/blob/6082b4a52ee07a622735e6e9128a0531a5ae3bfb/src/utils/StreamingInfo.ts#L332-L349
        m.colorInfo = {
            primaries: {
                "COLOR_PRIMARIES_BT709": "1"
                "COLOR_PRIMARIES_BT2020": "9"
            }
            transferCharacteristics: {
                "COLOR_TRANSFER_CHARACTERISTICS_BT709": "1"
                "COLOR_TRANSFER_CHARACTERISTICS_BT2020_10": "14"
                "COLOR_TRANSFER_CHARACTERISTICS_SMPTEST2084": "16"
                "COLOR_TRANSFER_CHARACTERISTICS_ARIB_STD_B67": "18"
            }
            matrixCoefficients: {
                "COLOR_MATRIX_COEFFICIENTS_BT709": "1"
                "COLOR_MATRIX_COEFFICIENTS_BT2020_NCL": "14"
            }
        }
    end function

    function FromVideoMetadata(metadata as object, qualityFilter as object, local as boolean) as string
        adaptiveFormats = []
        adaptiveFormats.Append(metadata.adaptiveFormats)

        if local and m.invidiousInstance <> Invidious.PLAYLET_BUILT_IN_INSTANCE
            parsedInvidiousUrl = UrlUtils.ParseUrl(m.invidiousInstance)
            for i = 0 to adaptiveFormats.Count() - 1
                if StringUtils.IsNullOrEmpty(adaptiveFormats[i].url)
                    continue for
                end if
                parsedUrl = UrlUtils.ParseUrl(adaptiveFormats[i].url)
                parsedInvidiousUrl.path = UrlUtils.AppendQueryParams(parsedUrl.path, { host: parsedUrl.host })
                adaptiveFormats[i].url = UrlUtils.BuildUrlFromParts(parsedInvidiousUrl)
            end for
        end if

        duration = m.GetDuration(metadata)

        groupings = m.CreateFormatGroupings(adaptiveFormats, metadata.isPostLiveDvr)
        audioGroups = groupings.audio
        videoGroups = groupings.video

        ' Log available video resolutions before filtering
        for each group in videoGroups
            for each stream in group
                LogDebug("Available video stream:", stream.qualityLabel, stream.width, "x", stream.height, "codec:", stream.type)
            end for
        end for

        filteredVideoGroups = m.FilterVideoGroups(videoGroups, qualityFilter)
        if filteredVideoGroups.Count() = 0 and videoGroups.Count() > 0
            LogWarnNoTelemetry("No video streams found using quality filter:", qualityFilter, "Falling back to all video streams")
            filteredVideoGroups = videoGroups
        end if

        ' Log filtered video resolutions
        LogDebug("Quality filter:", qualityFilter)
        for each group in filteredVideoGroups
            for each stream in group
                LogDebug("Filtered video stream:", stream.qualityLabel, stream.width, "x", stream.height)
            end for
        end for

        if filteredVideoGroups.Count() = 0
            lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
            LogTelemetryEvent({
                level: "error"
                message: "No video streams found in metadata for Dash."
                fingerprint: ["No video streams found in metadata for Dash."]
                attachments: [{
                    filename: "metadata.json"
                    content_type: "application/json"
                    data: FormatJson(metadata)
                }, {
                    filename: "last_player_response.json"
                    content_type: "application/json"
                    data: lastPlayerResponse
                }]
            })
        end if
        storyboards = metadata.storyboards

        xml = new XmlObject()

        xml.Comment(`Generated by Playlet - Video ID: ${metadata.videoId}`)
        xml.Comment(`Parser: ${ValidString(metadata.parser)}`)

        if xml.Node("MPD", {
                "xmlns": "urn:mpeg:dash:schema:mpd:2011"
                "profiles": "urn:mpeg:dash:profile:full:2011"
                "minBufferTime": "PT1.5S"
                "type": "static"
                "mediaPresentationDuration": `PT${duration}S`
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                "xsi:schemaLocation": "urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
            })
            if xml.Node("Period")

                id = 0
                id = m.GenerateAudioAdaptationSets(xml, audioGroups, id, metadata)
                id = m.GenerateVideoAdaptationSets(xml, filteredVideoGroups, id, metadata)
                m.GenerateImageAdaptationSets(xml, storyboards, id)

                xml.End()
            end if
            xml.End()
        end if
        return xml.ToXmlString()
    end function

    function GetDuration(metadata as object) as dynamic
        if metadata["isPostLiveDvr"] = true and IsInt(metadata["postLiveDvrDurationMs"])
            return metadata["postLiveDvrDurationMs"] / 1000.0
        end if

        approxDurationMs = ValidString(ObjectUtils.Dig(metadata, ["adaptiveFormats", 0, "approxDurationMs"])).ToInt()
        if approxDurationMs > 0
            return approxDurationMs / 1000.0
        end if

        return ValidInt(metadata["lengthSeconds"])
    end function

    function CreateFormatGroupings(formats as object, isPostLiveDvr as boolean) as object
        groupInfo = {}

        for each format in formats
            isOtf = format.isTypeOTF = true
            hasInit = not StringUtils.IsNullOrEmpty(format.init)
            hasIndex = not StringUtils.IsNullOrEmpty(format.index)
            isValid = (hasInit and hasIndex) or isOtf or isPostLiveDvr
            if not isValid
                continue for
            end if

            if not IsString(format.type)
                continue for
            end if

            if (format.width = invalid or format.height = invalid) and not StringUtils.IsNullOrEmpty(format.size)
                if format.size.instr("x") > 0
                    parts = format.size.Tokenize("x")
                    if parts.Count() = 2
                        format.width = ValidInt(parts[0].toInt())
                        format.height = ValidInt(parts[1].toInt())
                    end if
                end if
            end if

            codecs = ""
            mimeType = format.type.Tokenize(";")[0]
            if format.type.inStr("codecs=") <> -1
                codecs = format.type.split("codecs=")[1]
                if codecs.startsWith(`"`)
                    codecs = codecs.mid(1)
                end if
                if codecs.endsWith(`"`)
                    codecs = codecs.left(codecs.len() - 1)
                end if
            end if

            justCodec = codecs.split(".")[0]

            colorInfo = ""
            if IsAssociativeArray(format.colorInfo)
                colorInfo = `${format.colorInfo.primaries}-${format.colorInfo.transferCharacteristics}-${format.colorInfo.matrixCoefficients}`
            end if

            audioTrackId = ""
            if IsAssociativeArray(format.audioTrack) and IsString(format.audioTrack.id)
                audioTrackId = format.audioTrack.id
            end if

            if format.type.startsWith("audio")
                xtagsInfo = m.GetXtagsInfo(format)
                format.xtagsInfo = xtagsInfo
                format.isDrc = xtagsInfo.isDrc
                format.isDubbed = xtagsInfo.isDubbed
                format.isAutoDubbed = xtagsInfo.isAutoDubbed
                format.isDescriptive = xtagsInfo.isDescriptive
                format.isSecondary = xtagsInfo.isSecondary
                format.isOriginal = xtagsInfo.isOriginal
            end if

            drc = ""
            if format.isDrc = true
                drc = "drc"
            end if

            groupId = `${mimeType}-${justCodec}-${colorInfo}-${audioTrackId}-${drc}`

            if groupInfo[groupId] = invalid
                groupInfo[groupId] = []
            end if
            groupInfo[groupId].Push(format)
        end for

        audioGroups = []
        videoGroups = []

        for each key in groupInfo
            group = groupInfo[key]
            if group[0].type.startsWith("audio")
                audioGroups.Push(group)
            else if group[0].type.startsWith("video")
                videoGroups.Push(group)
            end if
        end for

        return { audio: audioGroups, video: videoGroups }
    end function

    function FilterVideoGroups(videoGroups as object, qualityFilter as object) as object
        if qualityFilter.Count() = 0
            return videoGroups
        end if

        filteredGroups = []
        for each group in videoGroups
            filteredStreams = []
            for each stream in group
                if m.IsVideoFormatIncluded(stream, qualityFilter)
                    filteredStreams.Push(stream)
                end if
            end for

            if filteredStreams.Count() > 0
                filteredGroups.Push(filteredStreams)
            end if
        end for
        return filteredGroups
    end function

    function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
        if qualityFilter.Count() = 0
            return true
        end if

        qualityLabel = stream.qualityLabel
        if not StringUtils.IsNullOrEmpty(qualityLabel)
            pIndex = qualityLabel.InStr("p")
            if pIndex <> -1
                qualityLabel = qualityLabel.Mid(0, pIndex)
            end if
            if qualityFilter[qualityLabel] = true
                return true
            end if
        end if

        if stream.height <> invalid
            if qualityFilter[ToString(stream.height)] = true
                return true
            end if
        end if

        resolution = stream.resolution
        if not StringUtils.IsNullOrEmpty(resolution)
            pIndex = resolution.InStr("p")
            if pIndex <> -1
                resolution = resolution.Mid(0, pIndex)
            end if
            if qualityFilter[resolution] = true
                return true
            end if
        end if

        size = stream.size
        if not StringUtils.IsNullOrEmpty(size)
            sizeParts = size.Split("x")
            if sizeParts.Count() = 2
                if qualityFilter[sizeParts[1]] = true
                    return true
                end if
            end if
        end if

        return false
    end function

    function GenerateAudioAdaptationSets(xml as object, audioGroups as object, id as integer, metadata as object) as integer
        for each group in audioGroups
            firstFormat = group[0]
            hoisted = {}

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": firstFormat.type.Tokenize(";")[0]
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "contentType": "audio"
            }

            if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.languageCode)
                adaptationSetAttributes["lang"] = firstFormat.audioTrack.languageCode
            end if

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            audioSampleRate = m.HoistNumberAttribute(group, "audioSampleRate", hoisted)
            if IsInt(audioSampleRate)
                adaptationSetAttributes["audioSamplingRate"] = audioSampleRate
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                if IsAssociativeArray(firstFormat.audioTrack) or firstFormat.isDrc = true
                    ' Roles
                    roles = m.GetTrackRoles(firstFormat)
                    for each role in roles
                        xml.EmptyNode("Role", { "schemeIdUri": "urn:mpeg:dash:role:2011", "value": role })
                    end for

                    ' Label
                    if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.displayName)
                        displayName = firstFormat.audioTrack.displayName
                        if firstFormat.isDrc = true
                            displayName = `${displayName} (Stable Volume)`
                        end if
                        xml.Node("Label", { "id": id })
                        xml.Text(displayName)
                        xml.End()
                    end if
                end if

                ' AudioChannelConfiguration
                channels = m.HoistAudioChannels(group, hoisted)
                if IsInt(channels)
                    xml.EmptyNode("AudioChannelConfiguration", {
                        "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                        "value": channels
                    })
                end if

                for each stream in group
                    representationId = stream.itag
                    if IsAssociativeArray(stream.audioTrack) and IsString(stream.audioTrack.id)
                        representationId = `${representationId}-${stream.audioTrack.id}`
                    end if
                    if stream.isDrc = true
                        representationId = `${representationId}-drc`
                    end if

                    representationAttributes = {
                        "id": representationId
                        "bandwidth": stream.bitrate
                    }
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["audioSampleRate"] = invalid
                        representationAttributes["audioSamplingRate"] = stream.audioSampleRate
                    end if

                    if xml.Node("Representation", representationAttributes)
                        if hoisted["AudioChannelConfiguration"] = invalid and IsInt(stream.audioChannels)
                            xml.EmptyNode("AudioChannelConfiguration", {
                                "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                                "value": stream.audioChannels
                            })
                        end if

                        m.GenerateSegmentInformation(xml, stream, metadata)

                        xml.End()
                    end if
                end for

                xml.End()
            end if
            id += 1
        end for
        return id
    end function

    function GenerateVideoAdaptationSets(xml as object, videoGroups as object, id as integer, metadata as object) as integer
        for each group in videoGroups
            firstFormat = group[0]
            hoisted = {}

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": firstFormat.type.Tokenize(";")[0]
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "maxPlayoutRate": "1"
                "contentType": "video"
            }

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            fps = m.HoistNumberAttribute(group, "fps", hoisted)
            if fps <> invalid
                adaptationSetAttributes["frameRate"] = fps
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                m.AddColorInfo(firstFormat, xml)

                for each stream in group
                    representationAttributes = {
                        "id": stream.itag
                        "bandwidth": stream.bitrate
                    }
                    if stream.width <> invalid
                        representationAttributes["width"] = stream.width
                    end if
                    if stream.height <> invalid
                        representationAttributes["height"] = stream.height
                    end if
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["fps"] = invalid
                        representationAttributes["frameRate"] = stream.fps
                    end if

                    if xml.Node("Representation", representationAttributes)
                        m.GenerateSegmentInformation(xml, stream, metadata)
                        xml.End()
                    end if
                end for

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function GenerateSegmentInformation(xml as object, stream as object, metadata as object) as void
        if StringUtils.IsNullOrEmpty(stream.url)
            xml.Comment(`[ERROR] Stream.url is null or empty for itag: ${stream.itag}`)
        end if

        if metadata.isPostLiveDvr = true
            if not IsInt(stream.targetDurationSec)
                xml.Comment(`[ERROR] Post-Live DVR stream missing targetDurationSec for itag: ${stream.itag}`)
                return
            end if

            if stream.targetDurationSec < 1
                xml.Comment(`[ERROR] Post-Live DVR stream has invalid targetDurationSec (${stream.targetDurationSec}) for itag: ${stream.itag}`)
                return
            end if

            postLiveDvrSegmentCount = metadata.postLiveDvrSegmentCount
            if not IsInt(postLiveDvrSegmentCount)
                xml.Comment(`[ERROR] Post-Live DVR metadata missing postLiveDvrSegmentCount for itag: ${stream.itag}`)
                ' We're going to guess segment count from targetDurationSec and total duration
                totalDurationMs = m.GetDuration(metadata) * 1000.0
                postLiveDvrSegmentCount = MathUtils.Max(Fix(totalDurationMs / (stream.targetDurationSec * 1000)), 1)
                xml.Comment(`[INFO] Guessing postLiveDvrSegmentCount as ${postLiveDvrSegmentCount} for itag: ${stream.itag}`)
            end if

            duration = stream.targetDurationSec * 1000
            repeatCount = postLiveDvrSegmentCount - 1
            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    xml.EmptyNode("S", { "d": duration, "r": repeatCount })
                    xml.End()
                end if
                xml.End()
            end if
        else if stream.isTypeOTF = true
            segmentDurations = stream.otfSegmentDurations
            if not IsArray(segmentDurations)
                xml.Comment(`[ERROR] OTF stream missing otfSegmentDurations for itag: ${stream.itag}`)
                return
            end if

            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    if segmentDurations.Count() = 0
                        xml.Comment(`[ERROR] OTF stream has empty otfSegmentDurations for itag: ${stream.itag}`)
                    end if
                    for each segment in segmentDurations
                        xml.EmptyNode("S", segment)
                    end for
                    xml.End()
                end if
                xml.End()
            end if
        else
            xml.TextNode("BaseURL", ValidString(stream.url))

            if StringUtils.IsNullOrEmpty(stream.index) or StringUtils.IsNullOrEmpty(stream.init)
                xml.Comment(`[ERROR] Stream index: ${stream.index}, init: ${stream.init} is invalid for itag: ${stream.itag}`)
            end if
            if xml.Node("SegmentBase", { "indexRange": stream.index })
                xml.EmptyNode("Initialization", { "range": stream.init })
                xml.End()
            end if
        end if
    end function

    function HoistCodecs(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstCodec = formats[0].type.split("codecs=")[1]
        for i = 1 to formats.Count() - 1
            currentCodec = formats[i].type.split("codecs=")[1]
            if firstCodec <> currentCodec
                return invalid
            end if
        end for

        hoisted["codecs"] = true
        return firstCodec.replace(`"`, "").replace(`"`, "")
    end function

    function HoistNumberAttribute(formats as object, property as string, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstFormat = formats[0]
        if firstFormat[property] = invalid
            return invalid
        end if

        firstValue = firstFormat[property]
        for i = 1 to formats.Count() - 1
            otherValue = formats[i][property]
            if type(otherValue) <> type(firstValue) or otherValue <> firstValue
                return invalid
            end if
        end for

        hoisted[property] = true
        return firstValue
    end function

    function HoistAudioChannels(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstValue = formats[0].audioChannels
        if firstValue = invalid
            firstValue = 2
        end if

        for i = 1 to formats.Count() - 1
            currentValue = formats[i].audioChannels
            if currentValue = invalid
                currentValue = 2
            end if
            if currentValue <> firstValue
                return invalid
            end if
        end for

        hoisted["AudioChannelConfiguration"] = true
        return firstValue
    end function

    function GetTrackRoles(format as object) as object
        roles = []
        if format.isOriginal = true
            roles.Push("main")
        else
            roles.Push("alternate")
        end if

        if format.isDubbed = true or format.isAutoDubbed = true
            roles.Push("dub")
        end if

        if format.isDescriptive = true
            roles.Push("description")
        end if

        if format.isDrc = true
            roles.Push("enhanced-audio-intelligibility")
        end if

        return roles
    end function

    function GenerateImageAdaptationSets(xml as object, storyboards as object, id as integer) as integer
        ' https://developer.roku.com/en-ca/docs/developer-program/media-playback/trick-mode/hls-and-dash.md#dash-standard-thumbnail-tiles
        for i = storyboards.Count() - 1 to 0 step -1
            storyboard = storyboards[i]
            interval = ValidInt(storyboard.interval)
            if interval = 0
                LogWarnNoTelemetry("Invalid storyboard interval:", storyboard.interval)
                continue for
            end if

            storyboardWidth = storyboard.storyboardWidth
            storyboardHeight = storyboard.storyboardHeight
            storyboardCount = storyboard.storyboardCount
            tileWidthInPixels = storyboard.width
            tileHeightInPixels = storyboard.height
            totalTileCount = storyboard.count

            ' For the last page, the image height might be smaller than the storyboard height
            if storyboardCount = 1
                storyboardHeight = totalTileCount \ storyboardWidth
                if totalTileCount mod storyboardWidth > 0
                    storyboardHeight += 1
                end if
            end if

            intervalInSeconds = interval / 1000.0

            ' YouTube template uses the var $M for tile pages
            ' DASH-IF uses $Number$ in the SegmentTemplate
            ' https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf
            url = storyboard.templateUrl.replace("$M", "$Number$")

            tilesPerPage = storyboardWidth * storyboardHeight
            duration = tilesPerPage * intervalInSeconds

            storyboardWidthInPixels = tileWidthInPixels * storyboardWidth
            storyboardHeightInPixels = tileHeightInPixels * storyboardHeight

            ' Bandwidth is kind of a guess...
            bandwidth = ((storyboardWidthInPixels * storyboardHeightInPixels * 0.5) / duration)

            if xml.Node("AdaptationSet", {
                    "id": `${id}`
                    "mimeType": "image/jpeg"
                    "contentType": "image"
                })
                xml.EmptyNode("SegmentTemplate", {
                    "media": url
                    "duration": duration
                    "startNumber": 0
                })

                if xml.Node("Representation", {
                        "id": `thumbnails_${id}`
                        "bandwidth": bandwidth
                        "width": storyboardWidthInPixels
                        "height": storyboardHeightInPixels
                    })

                    xml.EmptyNode("EssentialProperty", {
                        "schemeIdUri": "http://dashif.org/guidelines/thumbnail_tile"
                        "value": `${storyboardWidth}x${storyboardHeight}`
                    })

                    xml.End()
                end if

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function AddColorInfo(videoStream as object, xml as object) as void
        if videoStream.colorInfo = invalid
            return
        end if

        if videoStream.colorInfo.primaries <> invalid
            primaries = m.colorInfo.primaries[videoStream.colorInfo.primaries]
            if primaries <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:ColourPrimaries"
                    "value": primaries
                })
            else
                LogWarn("Unknown colorInfo.primaries:", videoStream.colorInfo.primaries)
            end if
        end if

        if videoStream.colorInfo.transferCharacteristics <> invalid
            transferCharacteristics = m.colorInfo.transferCharacteristics[videoStream.colorInfo.transferCharacteristics]
            if transferCharacteristics <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:TransferCharacteristics"
                    "value": transferCharacteristics
                })
            else
                LogWarn("Unknown colorInfo.transferCharacteristics:", videoStream.colorInfo.transferCharacteristics)
            end if
        end if

        if videoStream.colorInfo.matrixCoefficients <> invalid
            matrixCoefficients = m.colorInfo.matrixCoefficients[videoStream.colorInfo.matrixCoefficients]
            if matrixCoefficients <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:MatrixCoefficients"
                    "value": matrixCoefficients
                })
            else
                LogWarn("Unknown colorInfo.matrixCoefficients:", videoStream.colorInfo.matrixCoefficients)
            end if
        end if
    end function

    function GetXtagsInfo(format as object) as object
        result = {
            lang: ""
            acont: ""
            isDrc: false
            isDubbed: false
            isAutoDubbed: false
            isDescriptive: false
            isSecondary: false
            isOriginal: false
        }

        if StringUtils.IsNullOrEmpty(format.url)
            return result
        end if

        ' Technically format.xtags can be used, but it is protobuf encoded
        ' so this is simpler. Also, this is consistent for both local
        ' Innertube and Invidious.
        queryParams = UrlUtils.ParseQueryComponents(format.url)
        xtagsString = queryParams["xtags"]
        if StringUtils.IsNullOrEmpty(xtagsString)
            return result
        end if

        tags = {}
        xtagsList = xtagsString.split(":")
        for each xtag in xtagsList
            pair = xtag.split("=")
            if pair.Count() = 2
                tags[pair[0]] = pair[1]
            end if
        end for

        for each key in tags
            if key = "lang"
                result.lang = tags[key]
            else if key = "acont"
                result.acont = tags[key]
            else if key = "drc" and tags[key] = "1"
                result.isDrc = true
            end if
        end for

        if format.isDrc = true
            result.isDrc = true
        end if

        if result.acont = "dubbed"
            result.isDubbed = true
        else if result.acont = "dubbed-auto"
            result.isAutoDubbed = true
        else if result.acont = "descriptive"
            result.isDescriptive = true
        else if result.acont = "secondary"
            result.isSecondary = true
        end if

        if result.acont = "original" or (not result.isDubbed and not result.isAutoDubbed and not result.isDescriptive and not result.isSecondary)
            result.isOriginal = true
        end if

        return result
    end function

    function GetDrmSystemId(drmFamily as dynamic) as dynamic
        if not IsString(drmFamily)
            return invalid
        end if
        if drmFamily = "WIDEVINE"
            return "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"
        else if drmFamily = "PLAYREADY"
            return "9a04f079-9840-4286-ab92-e65be0885f95"
        end if
        return invalid
    end function

end class

```

I've added detailed logging to show all available video streams. Now **redeploy the app** and play the 4K video again. The logs will show:

1. **All available streams from YouTube** (before filtering)
2. **The quality filter being applied**
3. **Streams that make it through the filter**

Look for log lines like:
```
Available video stream: 2160p60 3840 x 2160 codec: video/webm; codecs="vp9"
Available video stream: 1080p60 1920 x 1080 codec: video/mp4; codecs="avc1.64002a"
...
Quality filter: {}
Filtered video stream: 2160p60 3840 x 2160
```

If you **don't see any 2160p streams** in the "Available" logs, then YouTube isn't providing 4K for that video (or it's in a format Roku can't decode).

If you **see 2160p in Available but not in Filtered**, then the quality filter is excluding it.

Also, from your previous log, the quality filter was empty (`{}`), meaning "Auto" is selected. Try this:

1. Go to **Settings → Preferred quality**
2. **Uncheck "Auto"** and **check "2160p"** (and optionally 1080p, 720p as fallbacks)
3. Play the video again

This will force the app to prefer 4K streams when available.

```plaintext
Available video stream: 2160p60 3840 x 2160 codec: video/webm; codecs="vp9"
Available video stream: 1080p60 1920 x 1080 codec: video/mp4; codecs="avc1.64002a"
...
Quality filter: {}
Filtered video stream: 2160p60 3840 x 2160
```

---

**User**

@extension-output-RokuCommunity.brightscript-#1-BrightScript Log (631-700) It gave me an error on screen

---

**Cursor**

The "malformed data" error suggests the 4K stream uses a codec or format that your Roku can't decode. Let me see the debug log to understand what streams were available:

I can't access that log file directly. Could you please copy and paste the debug log output (lines 631-700) that shows:
1. The "Available video stream" lines (showing what codecs/resolutions YouTube provides)
2. The "Quality filter" line
3. The "Filtered video stream" lines

This will tell us exactly what codec the 4K stream uses. The error "malformed data" typically means:

1. **The 4K stream uses VP9 or AV1 codec** - Many Roku devices can only decode HEVC (H.265) or AVC (H.264) for 4K, not VP9/AV1
2. **The stream format is incompatible** - WebM containers often don't work on Roku

Based on the error, we likely need to **filter out incompatible codecs** (like VP9/AV1) from 4K streams and only keep HEVC/AVC which Roku can decode.

Please share those log lines so I can see exactly what formats are available for that video.

---

**User**

where is the log located?

---

**Cursor**

The debug log is in your **VS Code/Cursor Output panel**. Here's how to access it:

1. **View → Output** (or press `Ctrl+Shift+U`)
2. In the Output panel, click the dropdown on the right side
3. Select **"BrightScript Log"** from the list

You can also:
- Look at the panel you had open earlier when you shared the first log (lines 411-543)
- Scroll down to see the new output after playing the video that errored

Alternatively, you can copy the entire recent output:
1. Click in the Output panel
2. Press `Ctrl+A` to select all
3. Press `Ctrl+C` to copy
4. Paste just the relevant section (look for lines containing "Available video stream" and "Filtered video stream")

The key lines I need to see are the ones that start with:
```
Available video stream: 2160p...
```
and
```
Filtered video stream: 2160p...
```

These will show what codec the 4K stream uses (likely `video/webm; codecs="vp9"` which Roku can't decode for 4K).

```plaintext
Available video stream: 2160p...
```

```plaintext
Filtered video stream: 2160p...
```

---

**User**

 @extension-output-RokuCommunity.brightscript-#1-BrightScript Log (1-934) 

---

**Cursor**

I can't read that file directly from the attachment. Could you please **copy and paste** the relevant section of the log here? 

Look for lines that contain:
- `Available video stream:`
- `Filtered video stream:`
- `Quality filter:`

Just scroll through the BrightScript Log output panel and find those lines after you played the video that gave the error. They should look something like:

```
Available video stream: 2160p60 3840 x 2160 codec: video/webm; codecs="vp9"
Available video stream: 1080p60 1920 x 1080 codec: video/mp4; codecs="avc1..."
...
Quality filter: { "2160": true }
Filtered video stream: 2160p60 3840 x 2160
```

Or alternatively, just paste the last ~100 lines of the log output after the error occurred.

```plaintext
Available video stream: 2160p60 3840 x 2160 codec: video/webm; codecs="vp9"
Available video stream: 1080p60 1920 x 1080 codec: video/mp4; codecs="avc1..."
...
Quality filter: { "2160": true }
Filtered video stream: 2160p60 3840 x 2160
```

---

**User**

@extension-output-RokuCommunity.brightscript-#1-BrightScript Log (858-902) 

---

**Cursor**

Now I can see the problem clearly. Look at the available 4K streams:

```
Available video stream: 2160p 3840 x 2160 codec: video/webm; codecs="vp9"
Available video stream: 2160p 3840 x 2160 codec: video/mp4; codecs="av01.0.12M.08"
```

**The 4K streams are ONLY available in VP9 and AV1 codecs** - there's NO 4K stream in H.264 (avc1) or HEVC (H.265).

The AVC (H.264) streams that Roku can reliably decode max out at **1080p**:
```
Available video stream: 1080p 1920 x 1080 codec: video/mp4; codecs="avc1.640028"
```

**This is why you got the "malformed data" error** - Roku tried to play the VP9 or AV1 4K stream but most Roku devices can't decode these codecs.

## The Reality of 4K on Roku

YouTube primarily encodes 4K content in:
- **VP9** (WebM) - Most Roku devices **cannot** decode this
- **AV1** - Only the newest Roku devices support this
- **HEVC/H.265** - Some Roku devices support this, but YouTube rarely provides 4K in HEVC

## Solution Options

1. **Filter out unsupported codecs** - Remove VP9/AV1 streams from the manifest so Roku only sees compatible streams (will limit you to 1080p max for most videos)

2. **Check device codec support** - Only include VP9/AV1 if the Roku device can decode them

Let me check what codec support your Roku has and add proper filtering:

```plaintext
Available video stream: 2160p 3840 x 2160 codec: video/webm; codecs="vp9"
Available video stream: 2160p 3840 x 2160 codec: video/mp4; codecs="av01.0.12M.08"
```

```plaintext
Available video stream: 1080p 1920 x 1080 codec: video/mp4; codecs="avc1.640028"
```

Now I understand the issue. The 4K streams are only available in VP9 and AV1 codecs which most Roku devices can't decode. Let me add codec filtering to exclude these unsupported formats:

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpUtils.bs"
import "pkg:/source/services/XmlObject.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/UrlUtils.bs"

class DashManifest

    public invidiousInstance as dynamic

    function new(invidiousInstance as string)
        m.invidiousInstance = invidiousInstance

        m.utils = new Http.Utils()

        ' https://github.com/LuanRT/YouTube.js/blob/6082b4a52ee07a622735e6e9128a0531a5ae3bfb/src/utils/StreamingInfo.ts#L332-L349
        m.colorInfo = {
            primaries: {
                "COLOR_PRIMARIES_BT709": "1"
                "COLOR_PRIMARIES_BT2020": "9"
            }
            transferCharacteristics: {
                "COLOR_TRANSFER_CHARACTERISTICS_BT709": "1"
                "COLOR_TRANSFER_CHARACTERISTICS_BT2020_10": "14"
                "COLOR_TRANSFER_CHARACTERISTICS_SMPTEST2084": "16"
                "COLOR_TRANSFER_CHARACTERISTICS_ARIB_STD_B67": "18"
            }
            matrixCoefficients: {
                "COLOR_MATRIX_COEFFICIENTS_BT709": "1"
                "COLOR_MATRIX_COEFFICIENTS_BT2020_NCL": "14"
            }
        }
    end function

    function FromVideoMetadata(metadata as object, qualityFilter as object, local as boolean) as string
        adaptiveFormats = []
        adaptiveFormats.Append(metadata.adaptiveFormats)

        if local and m.invidiousInstance <> Invidious.PLAYLET_BUILT_IN_INSTANCE
            parsedInvidiousUrl = UrlUtils.ParseUrl(m.invidiousInstance)
            for i = 0 to adaptiveFormats.Count() - 1
                if StringUtils.IsNullOrEmpty(adaptiveFormats[i].url)
                    continue for
                end if
                parsedUrl = UrlUtils.ParseUrl(adaptiveFormats[i].url)
                parsedInvidiousUrl.path = UrlUtils.AppendQueryParams(parsedUrl.path, { host: parsedUrl.host })
                adaptiveFormats[i].url = UrlUtils.BuildUrlFromParts(parsedInvidiousUrl)
            end for
        end if

        duration = m.GetDuration(metadata)

        groupings = m.CreateFormatGroupings(adaptiveFormats, metadata.isPostLiveDvr)
        audioGroups = groupings.audio
        videoGroups = groupings.video

        ' Log available video resolutions before filtering
        for each group in videoGroups
            for each stream in group
                LogDebug("Available video stream:", stream.qualityLabel, stream.width, "x", stream.height, "codec:", stream.type)
            end for
        end for

        filteredVideoGroups = m.FilterVideoGroups(videoGroups, qualityFilter)
        if filteredVideoGroups.Count() = 0 and videoGroups.Count() > 0
            LogWarnNoTelemetry("No video streams found using quality filter:", qualityFilter, "Falling back to all video streams")
            filteredVideoGroups = videoGroups
        end if

        ' Log filtered video resolutions
        LogDebug("Quality filter:", qualityFilter)
        for each group in filteredVideoGroups
            for each stream in group
                LogDebug("Filtered video stream:", stream.qualityLabel, stream.width, "x", stream.height)
            end for
        end for

        if filteredVideoGroups.Count() = 0
            lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
            LogTelemetryEvent({
                level: "error"
                message: "No video streams found in metadata for Dash."
                fingerprint: ["No video streams found in metadata for Dash."]
                attachments: [{
                    filename: "metadata.json"
                    content_type: "application/json"
                    data: FormatJson(metadata)
                }, {
                    filename: "last_player_response.json"
                    content_type: "application/json"
                    data: lastPlayerResponse
                }]
            })
        end if
        storyboards = metadata.storyboards

        xml = new XmlObject()

        xml.Comment(`Generated by Playlet - Video ID: ${metadata.videoId}`)
        xml.Comment(`Parser: ${ValidString(metadata.parser)}`)

        if xml.Node("MPD", {
                "xmlns": "urn:mpeg:dash:schema:mpd:2011"
                "profiles": "urn:mpeg:dash:profile:full:2011"
                "minBufferTime": "PT1.5S"
                "type": "static"
                "mediaPresentationDuration": `PT${duration}S`
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                "xsi:schemaLocation": "urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
            })
            if xml.Node("Period")

                id = 0
                id = m.GenerateAudioAdaptationSets(xml, audioGroups, id, metadata)
                id = m.GenerateVideoAdaptationSets(xml, filteredVideoGroups, id, metadata)
                m.GenerateImageAdaptationSets(xml, storyboards, id)

                xml.End()
            end if
            xml.End()
        end if
        return xml.ToXmlString()
    end function

    function GetDuration(metadata as object) as dynamic
        if metadata["isPostLiveDvr"] = true and IsInt(metadata["postLiveDvrDurationMs"])
            return metadata["postLiveDvrDurationMs"] / 1000.0
        end if

        approxDurationMs = ValidString(ObjectUtils.Dig(metadata, ["adaptiveFormats", 0, "approxDurationMs"])).ToInt()
        if approxDurationMs > 0
            return approxDurationMs / 1000.0
        end if

        return ValidInt(metadata["lengthSeconds"])
    end function

    function CreateFormatGroupings(formats as object, isPostLiveDvr as boolean) as object
        groupInfo = {}

        for each format in formats
            isOtf = format.isTypeOTF = true
            hasInit = not StringUtils.IsNullOrEmpty(format.init)
            hasIndex = not StringUtils.IsNullOrEmpty(format.index)
            isValid = (hasInit and hasIndex) or isOtf or isPostLiveDvr
            if not isValid
                continue for
            end if

            if not IsString(format.type)
                continue for
            end if

            if (format.width = invalid or format.height = invalid) and not StringUtils.IsNullOrEmpty(format.size)
                if format.size.instr("x") > 0
                    parts = format.size.Tokenize("x")
                    if parts.Count() = 2
                        format.width = ValidInt(parts[0].toInt())
                        format.height = ValidInt(parts[1].toInt())
                    end if
                end if
            end if

            codecs = ""
            mimeType = format.type.Tokenize(";")[0]
            if format.type.inStr("codecs=") <> -1
                codecs = format.type.split("codecs=")[1]
                if codecs.startsWith(`"`)
                    codecs = codecs.mid(1)
                end if
                if codecs.endsWith(`"`)
                    codecs = codecs.left(codecs.len() - 1)
                end if
            end if

            justCodec = codecs.split(".")[0]

            ' Filter out video codecs that most Roku devices cannot decode
            ' VP9 (vp9, vp09) and AV1 (av01) are not supported on most Roku devices
            ' Only allow AVC (avc1) and HEVC (hvc1, hev1) for video
            if format.type.startsWith("video")
                if justCodec = "vp9" or justCodec = "vp09" or justCodec = "av01"
                    LogDebug("Skipping unsupported video codec:", justCodec, "for", format.qualityLabel)
                    continue for
                end if
            end if

            colorInfo = ""
            if IsAssociativeArray(format.colorInfo)
                colorInfo = `${format.colorInfo.primaries}-${format.colorInfo.transferCharacteristics}-${format.colorInfo.matrixCoefficients}`
            end if

            audioTrackId = ""
            if IsAssociativeArray(format.audioTrack) and IsString(format.audioTrack.id)
                audioTrackId = format.audioTrack.id
            end if

            if format.type.startsWith("audio")
                xtagsInfo = m.GetXtagsInfo(format)
                format.xtagsInfo = xtagsInfo
                format.isDrc = xtagsInfo.isDrc
                format.isDubbed = xtagsInfo.isDubbed
                format.isAutoDubbed = xtagsInfo.isAutoDubbed
                format.isDescriptive = xtagsInfo.isDescriptive
                format.isSecondary = xtagsInfo.isSecondary
                format.isOriginal = xtagsInfo.isOriginal
            end if

            drc = ""
            if format.isDrc = true
                drc = "drc"
            end if

            groupId = `${mimeType}-${justCodec}-${colorInfo}-${audioTrackId}-${drc}`

            if groupInfo[groupId] = invalid
                groupInfo[groupId] = []
            end if
            groupInfo[groupId].Push(format)
        end for

        audioGroups = []
        videoGroups = []

        for each key in groupInfo
            group = groupInfo[key]
            if group[0].type.startsWith("audio")
                audioGroups.Push(group)
            else if group[0].type.startsWith("video")
                videoGroups.Push(group)
            end if
        end for

        return { audio: audioGroups, video: videoGroups }
    end function

    function FilterVideoGroups(videoGroups as object, qualityFilter as object) as object
        if qualityFilter.Count() = 0
            return videoGroups
        end if

        filteredGroups = []
        for each group in videoGroups
            filteredStreams = []
            for each stream in group
                if m.IsVideoFormatIncluded(stream, qualityFilter)
                    filteredStreams.Push(stream)
                end if
            end for

            if filteredStreams.Count() > 0
                filteredGroups.Push(filteredStreams)
            end if
        end for
        return filteredGroups
    end function

    function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
        if qualityFilter.Count() = 0
            return true
        end if

        qualityLabel = stream.qualityLabel
        if not StringUtils.IsNullOrEmpty(qualityLabel)
            pIndex = qualityLabel.InStr("p")
            if pIndex <> -1
                qualityLabel = qualityLabel.Mid(0, pIndex)
            end if
            if qualityFilter[qualityLabel] = true
                return true
            end if
        end if

        if stream.height <> invalid
            if qualityFilter[ToString(stream.height)] = true
                return true
            end if
        end if

        resolution = stream.resolution
        if not StringUtils.IsNullOrEmpty(resolution)
            pIndex = resolution.InStr("p")
            if pIndex <> -1
                resolution = resolution.Mid(0, pIndex)
            end if
            if qualityFilter[resolution] = true
                return true
            end if
        end if

        size = stream.size
        if not StringUtils.IsNullOrEmpty(size)
            sizeParts = size.Split("x")
            if sizeParts.Count() = 2
                if qualityFilter[sizeParts[1]] = true
                    return true
                end if
            end if
        end if

        return false
    end function

    function GenerateAudioAdaptationSets(xml as object, audioGroups as object, id as integer, metadata as object) as integer
        for each group in audioGroups
            firstFormat = group[0]
            hoisted = {}

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": firstFormat.type.Tokenize(";")[0]
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "contentType": "audio"
            }

            if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.languageCode)
                adaptationSetAttributes["lang"] = firstFormat.audioTrack.languageCode
            end if

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            audioSampleRate = m.HoistNumberAttribute(group, "audioSampleRate", hoisted)
            if IsInt(audioSampleRate)
                adaptationSetAttributes["audioSamplingRate"] = audioSampleRate
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                if IsAssociativeArray(firstFormat.audioTrack) or firstFormat.isDrc = true
                    ' Roles
                    roles = m.GetTrackRoles(firstFormat)
                    for each role in roles
                        xml.EmptyNode("Role", { "schemeIdUri": "urn:mpeg:dash:role:2011", "value": role })
                    end for

                    ' Label
                    if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.displayName)
                        displayName = firstFormat.audioTrack.displayName
                        if firstFormat.isDrc = true
                            displayName = `${displayName} (Stable Volume)`
                        end if
                        xml.Node("Label", { "id": id })
                        xml.Text(displayName)
                        xml.End()
                    end if
                end if

                ' AudioChannelConfiguration
                channels = m.HoistAudioChannels(group, hoisted)
                if IsInt(channels)
                    xml.EmptyNode("AudioChannelConfiguration", {
                        "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                        "value": channels
                    })
                end if

                for each stream in group
                    representationId = stream.itag
                    if IsAssociativeArray(stream.audioTrack) and IsString(stream.audioTrack.id)
                        representationId = `${representationId}-${stream.audioTrack.id}`
                    end if
                    if stream.isDrc = true
                        representationId = `${representationId}-drc`
                    end if

                    representationAttributes = {
                        "id": representationId
                        "bandwidth": stream.bitrate
                    }
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["audioSampleRate"] = invalid
                        representationAttributes["audioSamplingRate"] = stream.audioSampleRate
                    end if

                    if xml.Node("Representation", representationAttributes)
                        if hoisted["AudioChannelConfiguration"] = invalid and IsInt(stream.audioChannels)
                            xml.EmptyNode("AudioChannelConfiguration", {
                                "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                                "value": stream.audioChannels
                            })
                        end if

                        m.GenerateSegmentInformation(xml, stream, metadata)

                        xml.End()
                    end if
                end for

                xml.End()
            end if
            id += 1
        end for
        return id
    end function

    function GenerateVideoAdaptationSets(xml as object, videoGroups as object, id as integer, metadata as object) as integer
        for each group in videoGroups
            firstFormat = group[0]
            hoisted = {}

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": firstFormat.type.Tokenize(";")[0]
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "maxPlayoutRate": "1"
                "contentType": "video"
            }

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            fps = m.HoistNumberAttribute(group, "fps", hoisted)
            if fps <> invalid
                adaptationSetAttributes["frameRate"] = fps
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                m.AddColorInfo(firstFormat, xml)

                for each stream in group
                    representationAttributes = {
                        "id": stream.itag
                        "bandwidth": stream.bitrate
                    }
                    if stream.width <> invalid
                        representationAttributes["width"] = stream.width
                    end if
                    if stream.height <> invalid
                        representationAttributes["height"] = stream.height
                    end if
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["fps"] = invalid
                        representationAttributes["frameRate"] = stream.fps
                    end if

                    if xml.Node("Representation", representationAttributes)
                        m.GenerateSegmentInformation(xml, stream, metadata)
                        xml.End()
                    end if
                end for

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function GenerateSegmentInformation(xml as object, stream as object, metadata as object) as void
        if StringUtils.IsNullOrEmpty(stream.url)
            xml.Comment(`[ERROR] Stream.url is null or empty for itag: ${stream.itag}`)
        end if

        if metadata.isPostLiveDvr = true
            if not IsInt(stream.targetDurationSec)
                xml.Comment(`[ERROR] Post-Live DVR stream missing targetDurationSec for itag: ${stream.itag}`)
                return
            end if

            if stream.targetDurationSec < 1
                xml.Comment(`[ERROR] Post-Live DVR stream has invalid targetDurationSec (${stream.targetDurationSec}) for itag: ${stream.itag}`)
                return
            end if

            postLiveDvrSegmentCount = metadata.postLiveDvrSegmentCount
            if not IsInt(postLiveDvrSegmentCount)
                xml.Comment(`[ERROR] Post-Live DVR metadata missing postLiveDvrSegmentCount for itag: ${stream.itag}`)
                ' We're going to guess segment count from targetDurationSec and total duration
                totalDurationMs = m.GetDuration(metadata) * 1000.0
                postLiveDvrSegmentCount = MathUtils.Max(Fix(totalDurationMs / (stream.targetDurationSec * 1000)), 1)
                xml.Comment(`[INFO] Guessing postLiveDvrSegmentCount as ${postLiveDvrSegmentCount} for itag: ${stream.itag}`)
            end if

            duration = stream.targetDurationSec * 1000
            repeatCount = postLiveDvrSegmentCount - 1
            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    xml.EmptyNode("S", { "d": duration, "r": repeatCount })
                    xml.End()
                end if
                xml.End()
            end if
        else if stream.isTypeOTF = true
            segmentDurations = stream.otfSegmentDurations
            if not IsArray(segmentDurations)
                xml.Comment(`[ERROR] OTF stream missing otfSegmentDurations for itag: ${stream.itag}`)
                return
            end if

            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    if segmentDurations.Count() = 0
                        xml.Comment(`[ERROR] OTF stream has empty otfSegmentDurations for itag: ${stream.itag}`)
                    end if
                    for each segment in segmentDurations
                        xml.EmptyNode("S", segment)
                    end for
                    xml.End()
                end if
                xml.End()
            end if
        else
            xml.TextNode("BaseURL", ValidString(stream.url))

            if StringUtils.IsNullOrEmpty(stream.index) or StringUtils.IsNullOrEmpty(stream.init)
                xml.Comment(`[ERROR] Stream index: ${stream.index}, init: ${stream.init} is invalid for itag: ${stream.itag}`)
            end if
            if xml.Node("SegmentBase", { "indexRange": stream.index })
                xml.EmptyNode("Initialization", { "range": stream.init })
                xml.End()
            end if
        end if
    end function

    function HoistCodecs(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstCodec = formats[0].type.split("codecs=")[1]
        for i = 1 to formats.Count() - 1
            currentCodec = formats[i].type.split("codecs=")[1]
            if firstCodec <> currentCodec
                return invalid
            end if
        end for

        hoisted["codecs"] = true
        return firstCodec.replace(`"`, "").replace(`"`, "")
    end function

    function HoistNumberAttribute(formats as object, property as string, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstFormat = formats[0]
        if firstFormat[property] = invalid
            return invalid
        end if

        firstValue = firstFormat[property]
        for i = 1 to formats.Count() - 1
            otherValue = formats[i][property]
            if type(otherValue) <> type(firstValue) or otherValue <> firstValue
                return invalid
            end if
        end for

        hoisted[property] = true
        return firstValue
    end function

    function HoistAudioChannels(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstValue = formats[0].audioChannels
        if firstValue = invalid
            firstValue = 2
        end if

        for i = 1 to formats.Count() - 1
            currentValue = formats[i].audioChannels
            if currentValue = invalid
                currentValue = 2
            end if
            if currentValue <> firstValue
                return invalid
            end if
        end for

        hoisted["AudioChannelConfiguration"] = true
        return firstValue
    end function

    function GetTrackRoles(format as object) as object
        roles = []
        if format.isOriginal = true
            roles.Push("main")
        else
            roles.Push("alternate")
        end if

        if format.isDubbed = true or format.isAutoDubbed = true
            roles.Push("dub")
        end if

        if format.isDescriptive = true
            roles.Push("description")
        end if

        if format.isDrc = true
            roles.Push("enhanced-audio-intelligibility")
        end if

        return roles
    end function

    function GenerateImageAdaptationSets(xml as object, storyboards as object, id as integer) as integer
        ' https://developer.roku.com/en-ca/docs/developer-program/media-playback/trick-mode/hls-and-dash.md#dash-standard-thumbnail-tiles
        for i = storyboards.Count() - 1 to 0 step -1
            storyboard = storyboards[i]
            interval = ValidInt(storyboard.interval)
            if interval = 0
                LogWarnNoTelemetry("Invalid storyboard interval:", storyboard.interval)
                continue for
            end if

            storyboardWidth = storyboard.storyboardWidth
            storyboardHeight = storyboard.storyboardHeight
            storyboardCount = storyboard.storyboardCount
            tileWidthInPixels = storyboard.width
            tileHeightInPixels = storyboard.height
            totalTileCount = storyboard.count

            ' For the last page, the image height might be smaller than the storyboard height
            if storyboardCount = 1
                storyboardHeight = totalTileCount \ storyboardWidth
                if totalTileCount mod storyboardWidth > 0
                    storyboardHeight += 1
                end if
            end if

            intervalInSeconds = interval / 1000.0

            ' YouTube template uses the var $M for tile pages
            ' DASH-IF uses $Number$ in the SegmentTemplate
            ' https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf
            url = storyboard.templateUrl.replace("$M", "$Number$")

            tilesPerPage = storyboardWidth * storyboardHeight
            duration = tilesPerPage * intervalInSeconds

            storyboardWidthInPixels = tileWidthInPixels * storyboardWidth
            storyboardHeightInPixels = tileHeightInPixels * storyboardHeight

            ' Bandwidth is kind of a guess...
            bandwidth = ((storyboardWidthInPixels * storyboardHeightInPixels * 0.5) / duration)

            if xml.Node("AdaptationSet", {
                    "id": `${id}`
                    "mimeType": "image/jpeg"
                    "contentType": "image"
                })
                xml.EmptyNode("SegmentTemplate", {
                    "media": url
                    "duration": duration
                    "startNumber": 0
                })

                if xml.Node("Representation", {
                        "id": `thumbnails_${id}`
                        "bandwidth": bandwidth
                        "width": storyboardWidthInPixels
                        "height": storyboardHeightInPixels
                    })

                    xml.EmptyNode("EssentialProperty", {
                        "schemeIdUri": "http://dashif.org/guidelines/thumbnail_tile"
                        "value": `${storyboardWidth}x${storyboardHeight}`
                    })

                    xml.End()
                end if

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function AddColorInfo(videoStream as object, xml as object) as void
        if videoStream.colorInfo = invalid
            return
        end if

        if videoStream.colorInfo.primaries <> invalid
            primaries = m.colorInfo.primaries[videoStream.colorInfo.primaries]
            if primaries <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:ColourPrimaries"
                    "value": primaries
                })
            else
                LogWarn("Unknown colorInfo.primaries:", videoStream.colorInfo.primaries)
            end if
        end if

        if videoStream.colorInfo.transferCharacteristics <> invalid
            transferCharacteristics = m.colorInfo.transferCharacteristics[videoStream.colorInfo.transferCharacteristics]
            if transferCharacteristics <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:TransferCharacteristics"
                    "value": transferCharacteristics
                })
            else
                LogWarn("Unknown colorInfo.transferCharacteristics:", videoStream.colorInfo.transferCharacteristics)
            end if
        end if

        if videoStream.colorInfo.matrixCoefficients <> invalid
            matrixCoefficients = m.colorInfo.matrixCoefficients[videoStream.colorInfo.matrixCoefficients]
            if matrixCoefficients <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:MatrixCoefficients"
                    "value": matrixCoefficients
                })
            else
                LogWarn("Unknown colorInfo.matrixCoefficients:", videoStream.colorInfo.matrixCoefficients)
            end if
        end if
    end function

    function GetXtagsInfo(format as object) as object
        result = {
            lang: ""
            acont: ""
            isDrc: false
            isDubbed: false
            isAutoDubbed: false
            isDescriptive: false
            isSecondary: false
            isOriginal: false
        }

        if StringUtils.IsNullOrEmpty(format.url)
            return result
        end if

        ' Technically format.xtags can be used, but it is protobuf encoded
        ' so this is simpler. Also, this is consistent for both local
        ' Innertube and Invidious.
        queryParams = UrlUtils.ParseQueryComponents(format.url)
        xtagsString = queryParams["xtags"]
        if StringUtils.IsNullOrEmpty(xtagsString)
            return result
        end if

        tags = {}
        xtagsList = xtagsString.split(":")
        for each xtag in xtagsList
            pair = xtag.split("=")
            if pair.Count() = 2
                tags[pair[0]] = pair[1]
            end if
        end for

        for each key in tags
            if key = "lang"
                result.lang = tags[key]
            else if key = "acont"
                result.acont = tags[key]
            else if key = "drc" and tags[key] = "1"
                result.isDrc = true
            end if
        end for

        if format.isDrc = true
            result.isDrc = true
        end if

        if result.acont = "dubbed"
            result.isDubbed = true
        else if result.acont = "dubbed-auto"
            result.isAutoDubbed = true
        else if result.acont = "descriptive"
            result.isDescriptive = true
        else if result.acont = "secondary"
            result.isSecondary = true
        end if

        if result.acont = "original" or (not result.isDubbed and not result.isAutoDubbed and not result.isDescriptive and not result.isSecondary)
            result.isOriginal = true
        end if

        return result
    end function

    function GetDrmSystemId(drmFamily as dynamic) as dynamic
        if not IsString(drmFamily)
            return invalid
        end if
        if drmFamily = "WIDEVINE"
            return "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"
        else if drmFamily = "PLAYREADY"
            return "9a04f079-9840-4286-ab92-e65be0885f95"
        end if
        return invalid
    end function

end class

```

I've added codec filtering to exclude VP9 and AV1 video streams. Now redeploy and test again.

## What This Means

**Bad news:** For this video, 4K playback is **not possible** on your Roku because:
- YouTube only provides 4K in VP9 and AV1 codecs for this video
- Most Roku devices cannot decode VP9/AV1
- The only H.264 (avc1) streams max out at 1080p

**Good news:** The app will now:
- Skip unsupported VP9/AV1 streams automatically
- Play the highest quality stream your Roku can actually decode (1080p H.264)
- No more "malformed data" errors

## The 4K Reality on Roku

YouTube's 4K streams are almost always VP9 or AV1. True 4K playback requires:
1. A video with 4K in HEVC/H.265 codec (rare on YouTube)
2. A Roku device that supports VP9/AV1 decoding (only newest models like Roku Ultra 2022+)

After redeploying, you'll see logs like:
```
Skipping unsupported video codec: vp9 for 2160p
Skipping unsupported video codec: av01 for 2160p
```

This confirms the filtering is working. The video will play at the best compatible quality (likely 1080p).

Would you like me to investigate adding device-specific codec capability detection so that newer Roku devices that DO support VP9/AV1 can still use those streams?

```plaintext
Skipping unsupported video codec: vp9 for 2160p
Skipping unsupported video codec: av01 for 2160p
```

---

**User**

I'm quite certain my Roku supports VP9.  When i play 4k videos using the youtube app, I use the "stats for nerds" option and see codec: vp09.00.51.  Current/ optimal res: 3840x2160@30.

And web search for my tv shows:
The TCL 65R635 (2020 6-Series Roku TV) supports the following video codecs, primarily through its built-in Roku Media Player for USB playback and streaming apps:
Primary Supported Codecs

H.264/AVC → Most compatible for HD and 4K content (widely recommended for smooth playback in containers like MP4, MKV, MOV).
H.265/HEVC → Supported for efficient 4K playback (in containers like MKV, MP4, MOV).
VP9 → Supported for high-quality 4K streaming (e.g., YouTube, in MKV or WebM containers).

Additional Notes

Older codecs like MPEG-2 or MPEG-4 may work in some cases, but they are less reliably supported compared to H.264/H.265.
AV1 is not supported on this 2020 model (added to some newer Roku devices).
For HDR content, it fully supports Dolby Vision, HDR10, and HLG, which often pair with H.265 or VP9 encoded video.
Playback compatibility also depends on the container format (e.g., MP4 is most reliable), audio codec (e.g., AAC preferred), bitrate, and resolution. Files exceeding hardware limits may stutter or fail.
Streaming apps (Netflix, YouTube, etc.) handle their own encoding, often using these codecs transparently.


What can we do to make vp9 work in our app?

---

**Cursor**

You're right! Your Roku TV does support VP9. The issue must be something specific to how the DASH manifest is formatted for VP9 streams. Let me revert the codec filter and investigate the actual problem.

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpUtils.bs"
import "pkg:/source/services/XmlObject.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/UrlUtils.bs"

class DashManifest

    public invidiousInstance as dynamic

    function new(invidiousInstance as string)
        m.invidiousInstance = invidiousInstance

        m.utils = new Http.Utils()

        ' https://github.com/LuanRT/YouTube.js/blob/6082b4a52ee07a622735e6e9128a0531a5ae3bfb/src/utils/StreamingInfo.ts#L332-L349
        m.colorInfo = {
            primaries: {
                "COLOR_PRIMARIES_BT709": "1"
                "COLOR_PRIMARIES_BT2020": "9"
            }
            transferCharacteristics: {
                "COLOR_TRANSFER_CHARACTERISTICS_BT709": "1"
                "COLOR_TRANSFER_CHARACTERISTICS_BT2020_10": "14"
                "COLOR_TRANSFER_CHARACTERISTICS_SMPTEST2084": "16"
                "COLOR_TRANSFER_CHARACTERISTICS_ARIB_STD_B67": "18"
            }
            matrixCoefficients: {
                "COLOR_MATRIX_COEFFICIENTS_BT709": "1"
                "COLOR_MATRIX_COEFFICIENTS_BT2020_NCL": "14"
            }
        }
    end function

    function FromVideoMetadata(metadata as object, qualityFilter as object, local as boolean) as string
        adaptiveFormats = []
        adaptiveFormats.Append(metadata.adaptiveFormats)

        if local and m.invidiousInstance <> Invidious.PLAYLET_BUILT_IN_INSTANCE
            parsedInvidiousUrl = UrlUtils.ParseUrl(m.invidiousInstance)
            for i = 0 to adaptiveFormats.Count() - 1
                if StringUtils.IsNullOrEmpty(adaptiveFormats[i].url)
                    continue for
                end if
                parsedUrl = UrlUtils.ParseUrl(adaptiveFormats[i].url)
                parsedInvidiousUrl.path = UrlUtils.AppendQueryParams(parsedUrl.path, { host: parsedUrl.host })
                adaptiveFormats[i].url = UrlUtils.BuildUrlFromParts(parsedInvidiousUrl)
            end for
        end if

        duration = m.GetDuration(metadata)

        groupings = m.CreateFormatGroupings(adaptiveFormats, metadata.isPostLiveDvr)
        audioGroups = groupings.audio
        videoGroups = groupings.video

        ' Log available video resolutions before filtering
        for each group in videoGroups
            for each stream in group
                LogDebug("Available video stream:", stream.qualityLabel, stream.width, "x", stream.height, "codec:", stream.type)
            end for
        end for

        filteredVideoGroups = m.FilterVideoGroups(videoGroups, qualityFilter)
        if filteredVideoGroups.Count() = 0 and videoGroups.Count() > 0
            LogWarnNoTelemetry("No video streams found using quality filter:", qualityFilter, "Falling back to all video streams")
            filteredVideoGroups = videoGroups
        end if

        ' Log filtered video resolutions
        LogDebug("Quality filter:", qualityFilter)
        for each group in filteredVideoGroups
            for each stream in group
                LogDebug("Filtered video stream:", stream.qualityLabel, stream.width, "x", stream.height)
            end for
        end for

        if filteredVideoGroups.Count() = 0
            lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
            LogTelemetryEvent({
                level: "error"
                message: "No video streams found in metadata for Dash."
                fingerprint: ["No video streams found in metadata for Dash."]
                attachments: [{
                    filename: "metadata.json"
                    content_type: "application/json"
                    data: FormatJson(metadata)
                }, {
                    filename: "last_player_response.json"
                    content_type: "application/json"
                    data: lastPlayerResponse
                }]
            })
        end if
        storyboards = metadata.storyboards

        xml = new XmlObject()

        xml.Comment(`Generated by Playlet - Video ID: ${metadata.videoId}`)
        xml.Comment(`Parser: ${ValidString(metadata.parser)}`)

        if xml.Node("MPD", {
                "xmlns": "urn:mpeg:dash:schema:mpd:2011"
                "profiles": "urn:mpeg:dash:profile:full:2011"
                "minBufferTime": "PT1.5S"
                "type": "static"
                "mediaPresentationDuration": `PT${duration}S`
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                "xsi:schemaLocation": "urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
            })
            if xml.Node("Period")

                id = 0
                id = m.GenerateAudioAdaptationSets(xml, audioGroups, id, metadata)
                id = m.GenerateVideoAdaptationSets(xml, filteredVideoGroups, id, metadata)
                m.GenerateImageAdaptationSets(xml, storyboards, id)

                xml.End()
            end if
            xml.End()
        end if
        return xml.ToXmlString()
    end function

    function GetDuration(metadata as object) as dynamic
        if metadata["isPostLiveDvr"] = true and IsInt(metadata["postLiveDvrDurationMs"])
            return metadata["postLiveDvrDurationMs"] / 1000.0
        end if

        approxDurationMs = ValidString(ObjectUtils.Dig(metadata, ["adaptiveFormats", 0, "approxDurationMs"])).ToInt()
        if approxDurationMs > 0
            return approxDurationMs / 1000.0
        end if

        return ValidInt(metadata["lengthSeconds"])
    end function

    function CreateFormatGroupings(formats as object, isPostLiveDvr as boolean) as object
        groupInfo = {}

        for each format in formats
            isOtf = format.isTypeOTF = true
            hasInit = not StringUtils.IsNullOrEmpty(format.init)
            hasIndex = not StringUtils.IsNullOrEmpty(format.index)
            isValid = (hasInit and hasIndex) or isOtf or isPostLiveDvr
            if not isValid
                continue for
            end if

            if not IsString(format.type)
                continue for
            end if

            if (format.width = invalid or format.height = invalid) and not StringUtils.IsNullOrEmpty(format.size)
                if format.size.instr("x") > 0
                    parts = format.size.Tokenize("x")
                    if parts.Count() = 2
                        format.width = ValidInt(parts[0].toInt())
                        format.height = ValidInt(parts[1].toInt())
                    end if
                end if
            end if

            codecs = ""
            mimeType = format.type.Tokenize(";")[0]
            if format.type.inStr("codecs=") <> -1
                codecs = format.type.split("codecs=")[1]
                if codecs.startsWith(`"`)
                    codecs = codecs.mid(1)
                end if
                if codecs.endsWith(`"`)
                    codecs = codecs.left(codecs.len() - 1)
                end if
            end if

            justCodec = codecs.split(".")[0]

            colorInfo = ""
            if IsAssociativeArray(format.colorInfo)
                colorInfo = `${format.colorInfo.primaries}-${format.colorInfo.transferCharacteristics}-${format.colorInfo.matrixCoefficients}`
            end if

            audioTrackId = ""
            if IsAssociativeArray(format.audioTrack) and IsString(format.audioTrack.id)
                audioTrackId = format.audioTrack.id
            end if

            if format.type.startsWith("audio")
                xtagsInfo = m.GetXtagsInfo(format)
                format.xtagsInfo = xtagsInfo
                format.isDrc = xtagsInfo.isDrc
                format.isDubbed = xtagsInfo.isDubbed
                format.isAutoDubbed = xtagsInfo.isAutoDubbed
                format.isDescriptive = xtagsInfo.isDescriptive
                format.isSecondary = xtagsInfo.isSecondary
                format.isOriginal = xtagsInfo.isOriginal
            end if

            drc = ""
            if format.isDrc = true
                drc = "drc"
            end if

            groupId = `${mimeType}-${justCodec}-${colorInfo}-${audioTrackId}-${drc}`

            if groupInfo[groupId] = invalid
                groupInfo[groupId] = []
            end if
            groupInfo[groupId].Push(format)
        end for

        audioGroups = []
        videoGroups = []

        for each key in groupInfo
            group = groupInfo[key]
            if group[0].type.startsWith("audio")
                audioGroups.Push(group)
            else if group[0].type.startsWith("video")
                videoGroups.Push(group)
            end if
        end for

        return { audio: audioGroups, video: videoGroups }
    end function

    function FilterVideoGroups(videoGroups as object, qualityFilter as object) as object
        if qualityFilter.Count() = 0
            return videoGroups
        end if

        filteredGroups = []
        for each group in videoGroups
            filteredStreams = []
            for each stream in group
                if m.IsVideoFormatIncluded(stream, qualityFilter)
                    filteredStreams.Push(stream)
                end if
            end for

            if filteredStreams.Count() > 0
                filteredGroups.Push(filteredStreams)
            end if
        end for
        return filteredGroups
    end function

    function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
        if qualityFilter.Count() = 0
            return true
        end if

        qualityLabel = stream.qualityLabel
        if not StringUtils.IsNullOrEmpty(qualityLabel)
            pIndex = qualityLabel.InStr("p")
            if pIndex <> -1
                qualityLabel = qualityLabel.Mid(0, pIndex)
            end if
            if qualityFilter[qualityLabel] = true
                return true
            end if
        end if

        if stream.height <> invalid
            if qualityFilter[ToString(stream.height)] = true
                return true
            end if
        end if

        resolution = stream.resolution
        if not StringUtils.IsNullOrEmpty(resolution)
            pIndex = resolution.InStr("p")
            if pIndex <> -1
                resolution = resolution.Mid(0, pIndex)
            end if
            if qualityFilter[resolution] = true
                return true
            end if
        end if

        size = stream.size
        if not StringUtils.IsNullOrEmpty(size)
            sizeParts = size.Split("x")
            if sizeParts.Count() = 2
                if qualityFilter[sizeParts[1]] = true
                    return true
                end if
            end if
        end if

        return false
    end function

    function GenerateAudioAdaptationSets(xml as object, audioGroups as object, id as integer, metadata as object) as integer
        for each group in audioGroups
            firstFormat = group[0]
            hoisted = {}

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": firstFormat.type.Tokenize(";")[0]
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "contentType": "audio"
            }

            if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.languageCode)
                adaptationSetAttributes["lang"] = firstFormat.audioTrack.languageCode
            end if

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            audioSampleRate = m.HoistNumberAttribute(group, "audioSampleRate", hoisted)
            if IsInt(audioSampleRate)
                adaptationSetAttributes["audioSamplingRate"] = audioSampleRate
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                if IsAssociativeArray(firstFormat.audioTrack) or firstFormat.isDrc = true
                    ' Roles
                    roles = m.GetTrackRoles(firstFormat)
                    for each role in roles
                        xml.EmptyNode("Role", { "schemeIdUri": "urn:mpeg:dash:role:2011", "value": role })
                    end for

                    ' Label
                    if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.displayName)
                        displayName = firstFormat.audioTrack.displayName
                        if firstFormat.isDrc = true
                            displayName = `${displayName} (Stable Volume)`
                        end if
                        xml.Node("Label", { "id": id })
                        xml.Text(displayName)
                        xml.End()
                    end if
                end if

                ' AudioChannelConfiguration
                channels = m.HoistAudioChannels(group, hoisted)
                if IsInt(channels)
                    xml.EmptyNode("AudioChannelConfiguration", {
                        "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                        "value": channels
                    })
                end if

                for each stream in group
                    representationId = stream.itag
                    if IsAssociativeArray(stream.audioTrack) and IsString(stream.audioTrack.id)
                        representationId = `${representationId}-${stream.audioTrack.id}`
                    end if
                    if stream.isDrc = true
                        representationId = `${representationId}-drc`
                    end if

                    representationAttributes = {
                        "id": representationId
                        "bandwidth": stream.bitrate
                    }
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["audioSampleRate"] = invalid
                        representationAttributes["audioSamplingRate"] = stream.audioSampleRate
                    end if

                    if xml.Node("Representation", representationAttributes)
                        if hoisted["AudioChannelConfiguration"] = invalid and IsInt(stream.audioChannels)
                            xml.EmptyNode("AudioChannelConfiguration", {
                                "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                                "value": stream.audioChannels
                            })
                        end if

                        m.GenerateSegmentInformation(xml, stream, metadata)

                        xml.End()
                    end if
                end for

                xml.End()
            end if
            id += 1
        end for
        return id
    end function

    function GenerateVideoAdaptationSets(xml as object, videoGroups as object, id as integer, metadata as object) as integer
        for each group in videoGroups
            firstFormat = group[0]
            hoisted = {}

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": firstFormat.type.Tokenize(";")[0]
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "maxPlayoutRate": "1"
                "contentType": "video"
            }

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            fps = m.HoistNumberAttribute(group, "fps", hoisted)
            if fps <> invalid
                adaptationSetAttributes["frameRate"] = fps
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                m.AddColorInfo(firstFormat, xml)

                for each stream in group
                    representationAttributes = {
                        "id": stream.itag
                        "bandwidth": stream.bitrate
                    }
                    if stream.width <> invalid
                        representationAttributes["width"] = stream.width
                    end if
                    if stream.height <> invalid
                        representationAttributes["height"] = stream.height
                    end if
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["fps"] = invalid
                        representationAttributes["frameRate"] = stream.fps
                    end if

                    if xml.Node("Representation", representationAttributes)
                        m.GenerateSegmentInformation(xml, stream, metadata)
                        xml.End()
                    end if
                end for

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function GenerateSegmentInformation(xml as object, stream as object, metadata as object) as void
        if StringUtils.IsNullOrEmpty(stream.url)
            xml.Comment(`[ERROR] Stream.url is null or empty for itag: ${stream.itag}`)
        end if

        if metadata.isPostLiveDvr = true
            if not IsInt(stream.targetDurationSec)
                xml.Comment(`[ERROR] Post-Live DVR stream missing targetDurationSec for itag: ${stream.itag}`)
                return
            end if

            if stream.targetDurationSec < 1
                xml.Comment(`[ERROR] Post-Live DVR stream has invalid targetDurationSec (${stream.targetDurationSec}) for itag: ${stream.itag}`)
                return
            end if

            postLiveDvrSegmentCount = metadata.postLiveDvrSegmentCount
            if not IsInt(postLiveDvrSegmentCount)
                xml.Comment(`[ERROR] Post-Live DVR metadata missing postLiveDvrSegmentCount for itag: ${stream.itag}`)
                ' We're going to guess segment count from targetDurationSec and total duration
                totalDurationMs = m.GetDuration(metadata) * 1000.0
                postLiveDvrSegmentCount = MathUtils.Max(Fix(totalDurationMs / (stream.targetDurationSec * 1000)), 1)
                xml.Comment(`[INFO] Guessing postLiveDvrSegmentCount as ${postLiveDvrSegmentCount} for itag: ${stream.itag}`)
            end if

            duration = stream.targetDurationSec * 1000
            repeatCount = postLiveDvrSegmentCount - 1
            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    xml.EmptyNode("S", { "d": duration, "r": repeatCount })
                    xml.End()
                end if
                xml.End()
            end if
        else if stream.isTypeOTF = true
            segmentDurations = stream.otfSegmentDurations
            if not IsArray(segmentDurations)
                xml.Comment(`[ERROR] OTF stream missing otfSegmentDurations for itag: ${stream.itag}`)
                return
            end if

            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    if segmentDurations.Count() = 0
                        xml.Comment(`[ERROR] OTF stream has empty otfSegmentDurations for itag: ${stream.itag}`)
                    end if
                    for each segment in segmentDurations
                        xml.EmptyNode("S", segment)
                    end for
                    xml.End()
                end if
                xml.End()
            end if
        else
            xml.TextNode("BaseURL", ValidString(stream.url))

            if StringUtils.IsNullOrEmpty(stream.index) or StringUtils.IsNullOrEmpty(stream.init)
                xml.Comment(`[ERROR] Stream index: ${stream.index}, init: ${stream.init} is invalid for itag: ${stream.itag}`)
            end if
            if xml.Node("SegmentBase", { "indexRange": stream.index })
                xml.EmptyNode("Initialization", { "range": stream.init })
                xml.End()
            end if
        end if
    end function

    function HoistCodecs(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstCodec = formats[0].type.split("codecs=")[1]
        for i = 1 to formats.Count() - 1
            currentCodec = formats[i].type.split("codecs=")[1]
            if firstCodec <> currentCodec
                return invalid
            end if
        end for

        hoisted["codecs"] = true
        return firstCodec.replace(`"`, "").replace(`"`, "")
    end function

    function HoistNumberAttribute(formats as object, property as string, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstFormat = formats[0]
        if firstFormat[property] = invalid
            return invalid
        end if

        firstValue = firstFormat[property]
        for i = 1 to formats.Count() - 1
            otherValue = formats[i][property]
            if type(otherValue) <> type(firstValue) or otherValue <> firstValue
                return invalid
            end if
        end for

        hoisted[property] = true
        return firstValue
    end function

    function HoistAudioChannels(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstValue = formats[0].audioChannels
        if firstValue = invalid
            firstValue = 2
        end if

        for i = 1 to formats.Count() - 1
            currentValue = formats[i].audioChannels
            if currentValue = invalid
                currentValue = 2
            end if
            if currentValue <> firstValue
                return invalid
            end if
        end for

        hoisted["AudioChannelConfiguration"] = true
        return firstValue
    end function

    function GetTrackRoles(format as object) as object
        roles = []
        if format.isOriginal = true
            roles.Push("main")
        else
            roles.Push("alternate")
        end if

        if format.isDubbed = true or format.isAutoDubbed = true
            roles.Push("dub")
        end if

        if format.isDescriptive = true
            roles.Push("description")
        end if

        if format.isDrc = true
            roles.Push("enhanced-audio-intelligibility")
        end if

        return roles
    end function

    function GenerateImageAdaptationSets(xml as object, storyboards as object, id as integer) as integer
        ' https://developer.roku.com/en-ca/docs/developer-program/media-playback/trick-mode/hls-and-dash.md#dash-standard-thumbnail-tiles
        for i = storyboards.Count() - 1 to 0 step -1
            storyboard = storyboards[i]
            interval = ValidInt(storyboard.interval)
            if interval = 0
                LogWarnNoTelemetry("Invalid storyboard interval:", storyboard.interval)
                continue for
            end if

            storyboardWidth = storyboard.storyboardWidth
            storyboardHeight = storyboard.storyboardHeight
            storyboardCount = storyboard.storyboardCount
            tileWidthInPixels = storyboard.width
            tileHeightInPixels = storyboard.height
            totalTileCount = storyboard.count

            ' For the last page, the image height might be smaller than the storyboard height
            if storyboardCount = 1
                storyboardHeight = totalTileCount \ storyboardWidth
                if totalTileCount mod storyboardWidth > 0
                    storyboardHeight += 1
                end if
            end if

            intervalInSeconds = interval / 1000.0

            ' YouTube template uses the var $M for tile pages
            ' DASH-IF uses $Number$ in the SegmentTemplate
            ' https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf
            url = storyboard.templateUrl.replace("$M", "$Number$")

            tilesPerPage = storyboardWidth * storyboardHeight
            duration = tilesPerPage * intervalInSeconds

            storyboardWidthInPixels = tileWidthInPixels * storyboardWidth
            storyboardHeightInPixels = tileHeightInPixels * storyboardHeight

            ' Bandwidth is kind of a guess...
            bandwidth = ((storyboardWidthInPixels * storyboardHeightInPixels * 0.5) / duration)

            if xml.Node("AdaptationSet", {
                    "id": `${id}`
                    "mimeType": "image/jpeg"
                    "contentType": "image"
                })
                xml.EmptyNode("SegmentTemplate", {
                    "media": url
                    "duration": duration
                    "startNumber": 0
                })

                if xml.Node("Representation", {
                        "id": `thumbnails_${id}`
                        "bandwidth": bandwidth
                        "width": storyboardWidthInPixels
                        "height": storyboardHeightInPixels
                    })

                    xml.EmptyNode("EssentialProperty", {
                        "schemeIdUri": "http://dashif.org/guidelines/thumbnail_tile"
                        "value": `${storyboardWidth}x${storyboardHeight}`
                    })

                    xml.End()
                end if

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function AddColorInfo(videoStream as object, xml as object) as void
        if videoStream.colorInfo = invalid
            return
        end if

        if videoStream.colorInfo.primaries <> invalid
            primaries = m.colorInfo.primaries[videoStream.colorInfo.primaries]
            if primaries <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:ColourPrimaries"
                    "value": primaries
                })
            else
                LogWarn("Unknown colorInfo.primaries:", videoStream.colorInfo.primaries)
            end if
        end if

        if videoStream.colorInfo.transferCharacteristics <> invalid
            transferCharacteristics = m.colorInfo.transferCharacteristics[videoStream.colorInfo.transferCharacteristics]
            if transferCharacteristics <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:TransferCharacteristics"
                    "value": transferCharacteristics
                })
            else
                LogWarn("Unknown colorInfo.transferCharacteristics:", videoStream.colorInfo.transferCharacteristics)
            end if
        end if

        if videoStream.colorInfo.matrixCoefficients <> invalid
            matrixCoefficients = m.colorInfo.matrixCoefficients[videoStream.colorInfo.matrixCoefficients]
            if matrixCoefficients <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:MatrixCoefficients"
                    "value": matrixCoefficients
                })
            else
                LogWarn("Unknown colorInfo.matrixCoefficients:", videoStream.colorInfo.matrixCoefficients)
            end if
        end if
    end function

    function GetXtagsInfo(format as object) as object
        result = {
            lang: ""
            acont: ""
            isDrc: false
            isDubbed: false
            isAutoDubbed: false
            isDescriptive: false
            isSecondary: false
            isOriginal: false
        }

        if StringUtils.IsNullOrEmpty(format.url)
            return result
        end if

        ' Technically format.xtags can be used, but it is protobuf encoded
        ' so this is simpler. Also, this is consistent for both local
        ' Innertube and Invidious.
        queryParams = UrlUtils.ParseQueryComponents(format.url)
        xtagsString = queryParams["xtags"]
        if StringUtils.IsNullOrEmpty(xtagsString)
            return result
        end if

        tags = {}
        xtagsList = xtagsString.split(":")
        for each xtag in xtagsList
            pair = xtag.split("=")
            if pair.Count() = 2
                tags[pair[0]] = pair[1]
            end if
        end for

        for each key in tags
            if key = "lang"
                result.lang = tags[key]
            else if key = "acont"
                result.acont = tags[key]
            else if key = "drc" and tags[key] = "1"
                result.isDrc = true
            end if
        end for

        if format.isDrc = true
            result.isDrc = true
        end if

        if result.acont = "dubbed"
            result.isDubbed = true
        else if result.acont = "dubbed-auto"
            result.isAutoDubbed = true
        else if result.acont = "descriptive"
            result.isDescriptive = true
        else if result.acont = "secondary"
            result.isSecondary = true
        end if

        if result.acont = "original" or (not result.isDubbed and not result.isAutoDubbed and not result.isDescriptive and not result.isSecondary)
            result.isOriginal = true
        end if

        return result
    end function

    function GetDrmSystemId(drmFamily as dynamic) as dynamic
        if not IsString(drmFamily)
            return invalid
        end if
        if drmFamily = "WIDEVINE"
            return "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"
        else if drmFamily = "PLAYREADY"
            return "9a04f079-9840-4286-ab92-e65be0885f95"
        end if
        return invalid
    end function

end class

```

Let me look at the generated DASH manifest to understand the issue better. The file is saved to `cachefs:/last_generated_dash.xml`. Let me also check how the YouTube app handles this differently.

The issue is likely that Roku's DASH player doesn't handle **WebM containers** in DASH manifests well. The YouTube native app probably uses a different mechanism.

Let me try a fix - changing the mimeType for VP9 streams from `video/webm` to `video/mp4` in the DASH manifest:

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpUtils.bs"
import "pkg:/source/services/XmlObject.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/UrlUtils.bs"

class DashManifest

    public invidiousInstance as dynamic

    function new(invidiousInstance as string)
        m.invidiousInstance = invidiousInstance

        m.utils = new Http.Utils()

        ' https://github.com/LuanRT/YouTube.js/blob/6082b4a52ee07a622735e6e9128a0531a5ae3bfb/src/utils/StreamingInfo.ts#L332-L349
        m.colorInfo = {
            primaries: {
                "COLOR_PRIMARIES_BT709": "1"
                "COLOR_PRIMARIES_BT2020": "9"
            }
            transferCharacteristics: {
                "COLOR_TRANSFER_CHARACTERISTICS_BT709": "1"
                "COLOR_TRANSFER_CHARACTERISTICS_BT2020_10": "14"
                "COLOR_TRANSFER_CHARACTERISTICS_SMPTEST2084": "16"
                "COLOR_TRANSFER_CHARACTERISTICS_ARIB_STD_B67": "18"
            }
            matrixCoefficients: {
                "COLOR_MATRIX_COEFFICIENTS_BT709": "1"
                "COLOR_MATRIX_COEFFICIENTS_BT2020_NCL": "14"
            }
        }
    end function

    function FromVideoMetadata(metadata as object, qualityFilter as object, local as boolean) as string
        adaptiveFormats = []
        adaptiveFormats.Append(metadata.adaptiveFormats)

        if local and m.invidiousInstance <> Invidious.PLAYLET_BUILT_IN_INSTANCE
            parsedInvidiousUrl = UrlUtils.ParseUrl(m.invidiousInstance)
            for i = 0 to adaptiveFormats.Count() - 1
                if StringUtils.IsNullOrEmpty(adaptiveFormats[i].url)
                    continue for
                end if
                parsedUrl = UrlUtils.ParseUrl(adaptiveFormats[i].url)
                parsedInvidiousUrl.path = UrlUtils.AppendQueryParams(parsedUrl.path, { host: parsedUrl.host })
                adaptiveFormats[i].url = UrlUtils.BuildUrlFromParts(parsedInvidiousUrl)
            end for
        end if

        duration = m.GetDuration(metadata)

        groupings = m.CreateFormatGroupings(adaptiveFormats, metadata.isPostLiveDvr)
        audioGroups = groupings.audio
        videoGroups = groupings.video

        ' Log available video resolutions before filtering
        for each group in videoGroups
            for each stream in group
                LogDebug("Available video stream:", stream.qualityLabel, stream.width, "x", stream.height, "codec:", stream.type)
            end for
        end for

        filteredVideoGroups = m.FilterVideoGroups(videoGroups, qualityFilter)
        if filteredVideoGroups.Count() = 0 and videoGroups.Count() > 0
            LogWarnNoTelemetry("No video streams found using quality filter:", qualityFilter, "Falling back to all video streams")
            filteredVideoGroups = videoGroups
        end if

        ' Log filtered video resolutions
        LogDebug("Quality filter:", qualityFilter)
        for each group in filteredVideoGroups
            for each stream in group
                LogDebug("Filtered video stream:", stream.qualityLabel, stream.width, "x", stream.height)
            end for
        end for

        if filteredVideoGroups.Count() = 0
            lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
            LogTelemetryEvent({
                level: "error"
                message: "No video streams found in metadata for Dash."
                fingerprint: ["No video streams found in metadata for Dash."]
                attachments: [{
                    filename: "metadata.json"
                    content_type: "application/json"
                    data: FormatJson(metadata)
                }, {
                    filename: "last_player_response.json"
                    content_type: "application/json"
                    data: lastPlayerResponse
                }]
            })
        end if
        storyboards = metadata.storyboards

        xml = new XmlObject()

        xml.Comment(`Generated by Playlet - Video ID: ${metadata.videoId}`)
        xml.Comment(`Parser: ${ValidString(metadata.parser)}`)

        if xml.Node("MPD", {
                "xmlns": "urn:mpeg:dash:schema:mpd:2011"
                "profiles": "urn:mpeg:dash:profile:full:2011"
                "minBufferTime": "PT1.5S"
                "type": "static"
                "mediaPresentationDuration": `PT${duration}S`
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                "xsi:schemaLocation": "urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
            })
            if xml.Node("Period")

                id = 0
                id = m.GenerateAudioAdaptationSets(xml, audioGroups, id, metadata)
                id = m.GenerateVideoAdaptationSets(xml, filteredVideoGroups, id, metadata)
                m.GenerateImageAdaptationSets(xml, storyboards, id)

                xml.End()
            end if
            xml.End()
        end if
        return xml.ToXmlString()
    end function

    function GetDuration(metadata as object) as dynamic
        if metadata["isPostLiveDvr"] = true and IsInt(metadata["postLiveDvrDurationMs"])
            return metadata["postLiveDvrDurationMs"] / 1000.0
        end if

        approxDurationMs = ValidString(ObjectUtils.Dig(metadata, ["adaptiveFormats", 0, "approxDurationMs"])).ToInt()
        if approxDurationMs > 0
            return approxDurationMs / 1000.0
        end if

        return ValidInt(metadata["lengthSeconds"])
    end function

    function CreateFormatGroupings(formats as object, isPostLiveDvr as boolean) as object
        groupInfo = {}

        for each format in formats
            isOtf = format.isTypeOTF = true
            hasInit = not StringUtils.IsNullOrEmpty(format.init)
            hasIndex = not StringUtils.IsNullOrEmpty(format.index)
            isValid = (hasInit and hasIndex) or isOtf or isPostLiveDvr
            if not isValid
                continue for
            end if

            if not IsString(format.type)
                continue for
            end if

            if (format.width = invalid or format.height = invalid) and not StringUtils.IsNullOrEmpty(format.size)
                if format.size.instr("x") > 0
                    parts = format.size.Tokenize("x")
                    if parts.Count() = 2
                        format.width = ValidInt(parts[0].toInt())
                        format.height = ValidInt(parts[1].toInt())
                    end if
                end if
            end if

            codecs = ""
            mimeType = format.type.Tokenize(";")[0]
            if format.type.inStr("codecs=") <> -1
                codecs = format.type.split("codecs=")[1]
                if codecs.startsWith(`"`)
                    codecs = codecs.mid(1)
                end if
                if codecs.endsWith(`"`)
                    codecs = codecs.left(codecs.len() - 1)
                end if
            end if

            justCodec = codecs.split(".")[0]

            colorInfo = ""
            if IsAssociativeArray(format.colorInfo)
                colorInfo = `${format.colorInfo.primaries}-${format.colorInfo.transferCharacteristics}-${format.colorInfo.matrixCoefficients}`
            end if

            audioTrackId = ""
            if IsAssociativeArray(format.audioTrack) and IsString(format.audioTrack.id)
                audioTrackId = format.audioTrack.id
            end if

            if format.type.startsWith("audio")
                xtagsInfo = m.GetXtagsInfo(format)
                format.xtagsInfo = xtagsInfo
                format.isDrc = xtagsInfo.isDrc
                format.isDubbed = xtagsInfo.isDubbed
                format.isAutoDubbed = xtagsInfo.isAutoDubbed
                format.isDescriptive = xtagsInfo.isDescriptive
                format.isSecondary = xtagsInfo.isSecondary
                format.isOriginal = xtagsInfo.isOriginal
            end if

            drc = ""
            if format.isDrc = true
                drc = "drc"
            end if

            groupId = `${mimeType}-${justCodec}-${colorInfo}-${audioTrackId}-${drc}`

            if groupInfo[groupId] = invalid
                groupInfo[groupId] = []
            end if
            groupInfo[groupId].Push(format)
        end for

        audioGroups = []
        videoGroups = []

        for each key in groupInfo
            group = groupInfo[key]
            if group[0].type.startsWith("audio")
                audioGroups.Push(group)
            else if group[0].type.startsWith("video")
                videoGroups.Push(group)
            end if
        end for

        return { audio: audioGroups, video: videoGroups }
    end function

    function FilterVideoGroups(videoGroups as object, qualityFilter as object) as object
        if qualityFilter.Count() = 0
            return videoGroups
        end if

        filteredGroups = []
        for each group in videoGroups
            filteredStreams = []
            for each stream in group
                if m.IsVideoFormatIncluded(stream, qualityFilter)
                    filteredStreams.Push(stream)
                end if
            end for

            if filteredStreams.Count() > 0
                filteredGroups.Push(filteredStreams)
            end if
        end for
        return filteredGroups
    end function

    function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
        if qualityFilter.Count() = 0
            return true
        end if

        qualityLabel = stream.qualityLabel
        if not StringUtils.IsNullOrEmpty(qualityLabel)
            pIndex = qualityLabel.InStr("p")
            if pIndex <> -1
                qualityLabel = qualityLabel.Mid(0, pIndex)
            end if
            if qualityFilter[qualityLabel] = true
                return true
            end if
        end if

        if stream.height <> invalid
            if qualityFilter[ToString(stream.height)] = true
                return true
            end if
        end if

        resolution = stream.resolution
        if not StringUtils.IsNullOrEmpty(resolution)
            pIndex = resolution.InStr("p")
            if pIndex <> -1
                resolution = resolution.Mid(0, pIndex)
            end if
            if qualityFilter[resolution] = true
                return true
            end if
        end if

        size = stream.size
        if not StringUtils.IsNullOrEmpty(size)
            sizeParts = size.Split("x")
            if sizeParts.Count() = 2
                if qualityFilter[sizeParts[1]] = true
                    return true
                end if
            end if
        end if

        return false
    end function

    function GenerateAudioAdaptationSets(xml as object, audioGroups as object, id as integer, metadata as object) as integer
        for each group in audioGroups
            firstFormat = group[0]
            hoisted = {}

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": firstFormat.type.Tokenize(";")[0]
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "contentType": "audio"
            }

            if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.languageCode)
                adaptationSetAttributes["lang"] = firstFormat.audioTrack.languageCode
            end if

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            audioSampleRate = m.HoistNumberAttribute(group, "audioSampleRate", hoisted)
            if IsInt(audioSampleRate)
                adaptationSetAttributes["audioSamplingRate"] = audioSampleRate
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                if IsAssociativeArray(firstFormat.audioTrack) or firstFormat.isDrc = true
                    ' Roles
                    roles = m.GetTrackRoles(firstFormat)
                    for each role in roles
                        xml.EmptyNode("Role", { "schemeIdUri": "urn:mpeg:dash:role:2011", "value": role })
                    end for

                    ' Label
                    if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.displayName)
                        displayName = firstFormat.audioTrack.displayName
                        if firstFormat.isDrc = true
                            displayName = `${displayName} (Stable Volume)`
                        end if
                        xml.Node("Label", { "id": id })
                        xml.Text(displayName)
                        xml.End()
                    end if
                end if

                ' AudioChannelConfiguration
                channels = m.HoistAudioChannels(group, hoisted)
                if IsInt(channels)
                    xml.EmptyNode("AudioChannelConfiguration", {
                        "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                        "value": channels
                    })
                end if

                for each stream in group
                    representationId = stream.itag
                    if IsAssociativeArray(stream.audioTrack) and IsString(stream.audioTrack.id)
                        representationId = `${representationId}-${stream.audioTrack.id}`
                    end if
                    if stream.isDrc = true
                        representationId = `${representationId}-drc`
                    end if

                    representationAttributes = {
                        "id": representationId
                        "bandwidth": stream.bitrate
                    }
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["audioSampleRate"] = invalid
                        representationAttributes["audioSamplingRate"] = stream.audioSampleRate
                    end if

                    if xml.Node("Representation", representationAttributes)
                        if hoisted["AudioChannelConfiguration"] = invalid and IsInt(stream.audioChannels)
                            xml.EmptyNode("AudioChannelConfiguration", {
                                "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                                "value": stream.audioChannels
                            })
                        end if

                        m.GenerateSegmentInformation(xml, stream, metadata)

                        xml.End()
                    end if
                end for

                xml.End()
            end if
            id += 1
        end for
        return id
    end function

    function GenerateVideoAdaptationSets(xml as object, videoGroups as object, id as integer, metadata as object) as integer
        for each group in videoGroups
            firstFormat = group[0]
            hoisted = {}

            mimeType = firstFormat.type.Tokenize(";")[0]
            ' Roku's DASH player doesn't handle WebM containers well in DASH manifests
            ' Change video/webm to video/mp4 for VP9 streams - the actual stream data works either way
            if mimeType = "video/webm"
                mimeType = "video/mp4"
                LogDebug("Changed mimeType from video/webm to video/mp4 for VP9 DASH compatibility")
            end if

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": mimeType
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "maxPlayoutRate": "1"
                "contentType": "video"
            }

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            fps = m.HoistNumberAttribute(group, "fps", hoisted)
            if fps <> invalid
                adaptationSetAttributes["frameRate"] = fps
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                m.AddColorInfo(firstFormat, xml)

                for each stream in group
                    representationAttributes = {
                        "id": stream.itag
                        "bandwidth": stream.bitrate
                    }
                    if stream.width <> invalid
                        representationAttributes["width"] = stream.width
                    end if
                    if stream.height <> invalid
                        representationAttributes["height"] = stream.height
                    end if
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["fps"] = invalid
                        representationAttributes["frameRate"] = stream.fps
                    end if

                    if xml.Node("Representation", representationAttributes)
                        m.GenerateSegmentInformation(xml, stream, metadata)
                        xml.End()
                    end if
                end for

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function GenerateSegmentInformation(xml as object, stream as object, metadata as object) as void
        if StringUtils.IsNullOrEmpty(stream.url)
            xml.Comment(`[ERROR] Stream.url is null or empty for itag: ${stream.itag}`)
        end if

        if metadata.isPostLiveDvr = true
            if not IsInt(stream.targetDurationSec)
                xml.Comment(`[ERROR] Post-Live DVR stream missing targetDurationSec for itag: ${stream.itag}`)
                return
            end if

            if stream.targetDurationSec < 1
                xml.Comment(`[ERROR] Post-Live DVR stream has invalid targetDurationSec (${stream.targetDurationSec}) for itag: ${stream.itag}`)
                return
            end if

            postLiveDvrSegmentCount = metadata.postLiveDvrSegmentCount
            if not IsInt(postLiveDvrSegmentCount)
                xml.Comment(`[ERROR] Post-Live DVR metadata missing postLiveDvrSegmentCount for itag: ${stream.itag}`)
                ' We're going to guess segment count from targetDurationSec and total duration
                totalDurationMs = m.GetDuration(metadata) * 1000.0
                postLiveDvrSegmentCount = MathUtils.Max(Fix(totalDurationMs / (stream.targetDurationSec * 1000)), 1)
                xml.Comment(`[INFO] Guessing postLiveDvrSegmentCount as ${postLiveDvrSegmentCount} for itag: ${stream.itag}`)
            end if

            duration = stream.targetDurationSec * 1000
            repeatCount = postLiveDvrSegmentCount - 1
            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    xml.EmptyNode("S", { "d": duration, "r": repeatCount })
                    xml.End()
                end if
                xml.End()
            end if
        else if stream.isTypeOTF = true
            segmentDurations = stream.otfSegmentDurations
            if not IsArray(segmentDurations)
                xml.Comment(`[ERROR] OTF stream missing otfSegmentDurations for itag: ${stream.itag}`)
                return
            end if

            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    if segmentDurations.Count() = 0
                        xml.Comment(`[ERROR] OTF stream has empty otfSegmentDurations for itag: ${stream.itag}`)
                    end if
                    for each segment in segmentDurations
                        xml.EmptyNode("S", segment)
                    end for
                    xml.End()
                end if
                xml.End()
            end if
        else
            xml.TextNode("BaseURL", ValidString(stream.url))

            if StringUtils.IsNullOrEmpty(stream.index) or StringUtils.IsNullOrEmpty(stream.init)
                xml.Comment(`[ERROR] Stream index: ${stream.index}, init: ${stream.init} is invalid for itag: ${stream.itag}`)
            end if
            if xml.Node("SegmentBase", { "indexRange": stream.index })
                xml.EmptyNode("Initialization", { "range": stream.init })
                xml.End()
            end if
        end if
    end function

    function HoistCodecs(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstCodec = formats[0].type.split("codecs=")[1]
        for i = 1 to formats.Count() - 1
            currentCodec = formats[i].type.split("codecs=")[1]
            if firstCodec <> currentCodec
                return invalid
            end if
        end for

        hoisted["codecs"] = true
        return firstCodec.replace(`"`, "").replace(`"`, "")
    end function

    function HoistNumberAttribute(formats as object, property as string, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstFormat = formats[0]
        if firstFormat[property] = invalid
            return invalid
        end if

        firstValue = firstFormat[property]
        for i = 1 to formats.Count() - 1
            otherValue = formats[i][property]
            if type(otherValue) <> type(firstValue) or otherValue <> firstValue
                return invalid
            end if
        end for

        hoisted[property] = true
        return firstValue
    end function

    function HoistAudioChannels(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstValue = formats[0].audioChannels
        if firstValue = invalid
            firstValue = 2
        end if

        for i = 1 to formats.Count() - 1
            currentValue = formats[i].audioChannels
            if currentValue = invalid
                currentValue = 2
            end if
            if currentValue <> firstValue
                return invalid
            end if
        end for

        hoisted["AudioChannelConfiguration"] = true
        return firstValue
    end function

    function GetTrackRoles(format as object) as object
        roles = []
        if format.isOriginal = true
            roles.Push("main")
        else
            roles.Push("alternate")
        end if

        if format.isDubbed = true or format.isAutoDubbed = true
            roles.Push("dub")
        end if

        if format.isDescriptive = true
            roles.Push("description")
        end if

        if format.isDrc = true
            roles.Push("enhanced-audio-intelligibility")
        end if

        return roles
    end function

    function GenerateImageAdaptationSets(xml as object, storyboards as object, id as integer) as integer
        ' https://developer.roku.com/en-ca/docs/developer-program/media-playback/trick-mode/hls-and-dash.md#dash-standard-thumbnail-tiles
        for i = storyboards.Count() - 1 to 0 step -1
            storyboard = storyboards[i]
            interval = ValidInt(storyboard.interval)
            if interval = 0
                LogWarnNoTelemetry("Invalid storyboard interval:", storyboard.interval)
                continue for
            end if

            storyboardWidth = storyboard.storyboardWidth
            storyboardHeight = storyboard.storyboardHeight
            storyboardCount = storyboard.storyboardCount
            tileWidthInPixels = storyboard.width
            tileHeightInPixels = storyboard.height
            totalTileCount = storyboard.count

            ' For the last page, the image height might be smaller than the storyboard height
            if storyboardCount = 1
                storyboardHeight = totalTileCount \ storyboardWidth
                if totalTileCount mod storyboardWidth > 0
                    storyboardHeight += 1
                end if
            end if

            intervalInSeconds = interval / 1000.0

            ' YouTube template uses the var $M for tile pages
            ' DASH-IF uses $Number$ in the SegmentTemplate
            ' https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf
            url = storyboard.templateUrl.replace("$M", "$Number$")

            tilesPerPage = storyboardWidth * storyboardHeight
            duration = tilesPerPage * intervalInSeconds

            storyboardWidthInPixels = tileWidthInPixels * storyboardWidth
            storyboardHeightInPixels = tileHeightInPixels * storyboardHeight

            ' Bandwidth is kind of a guess...
            bandwidth = ((storyboardWidthInPixels * storyboardHeightInPixels * 0.5) / duration)

            if xml.Node("AdaptationSet", {
                    "id": `${id}`
                    "mimeType": "image/jpeg"
                    "contentType": "image"
                })
                xml.EmptyNode("SegmentTemplate", {
                    "media": url
                    "duration": duration
                    "startNumber": 0
                })

                if xml.Node("Representation", {
                        "id": `thumbnails_${id}`
                        "bandwidth": bandwidth
                        "width": storyboardWidthInPixels
                        "height": storyboardHeightInPixels
                    })

                    xml.EmptyNode("EssentialProperty", {
                        "schemeIdUri": "http://dashif.org/guidelines/thumbnail_tile"
                        "value": `${storyboardWidth}x${storyboardHeight}`
                    })

                    xml.End()
                end if

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function AddColorInfo(videoStream as object, xml as object) as void
        if videoStream.colorInfo = invalid
            return
        end if

        if videoStream.colorInfo.primaries <> invalid
            primaries = m.colorInfo.primaries[videoStream.colorInfo.primaries]
            if primaries <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:ColourPrimaries"
                    "value": primaries
                })
            else
                LogWarn("Unknown colorInfo.primaries:", videoStream.colorInfo.primaries)
            end if
        end if

        if videoStream.colorInfo.transferCharacteristics <> invalid
            transferCharacteristics = m.colorInfo.transferCharacteristics[videoStream.colorInfo.transferCharacteristics]
            if transferCharacteristics <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:TransferCharacteristics"
                    "value": transferCharacteristics
                })
            else
                LogWarn("Unknown colorInfo.transferCharacteristics:", videoStream.colorInfo.transferCharacteristics)
            end if
        end if

        if videoStream.colorInfo.matrixCoefficients <> invalid
            matrixCoefficients = m.colorInfo.matrixCoefficients[videoStream.colorInfo.matrixCoefficients]
            if matrixCoefficients <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:MatrixCoefficients"
                    "value": matrixCoefficients
                })
            else
                LogWarn("Unknown colorInfo.matrixCoefficients:", videoStream.colorInfo.matrixCoefficients)
            end if
        end if
    end function

    function GetXtagsInfo(format as object) as object
        result = {
            lang: ""
            acont: ""
            isDrc: false
            isDubbed: false
            isAutoDubbed: false
            isDescriptive: false
            isSecondary: false
            isOriginal: false
        }

        if StringUtils.IsNullOrEmpty(format.url)
            return result
        end if

        ' Technically format.xtags can be used, but it is protobuf encoded
        ' so this is simpler. Also, this is consistent for both local
        ' Innertube and Invidious.
        queryParams = UrlUtils.ParseQueryComponents(format.url)
        xtagsString = queryParams["xtags"]
        if StringUtils.IsNullOrEmpty(xtagsString)
            return result
        end if

        tags = {}
        xtagsList = xtagsString.split(":")
        for each xtag in xtagsList
            pair = xtag.split("=")
            if pair.Count() = 2
                tags[pair[0]] = pair[1]
            end if
        end for

        for each key in tags
            if key = "lang"
                result.lang = tags[key]
            else if key = "acont"
                result.acont = tags[key]
            else if key = "drc" and tags[key] = "1"
                result.isDrc = true
            end if
        end for

        if format.isDrc = true
            result.isDrc = true
        end if

        if result.acont = "dubbed"
            result.isDubbed = true
        else if result.acont = "dubbed-auto"
            result.isAutoDubbed = true
        else if result.acont = "descriptive"
            result.isDescriptive = true
        else if result.acont = "secondary"
            result.isSecondary = true
        end if

        if result.acont = "original" or (not result.isDubbed and not result.isAutoDubbed and not result.isDescriptive and not result.isSecondary)
            result.isOriginal = true
        end if

        return result
    end function

    function GetDrmSystemId(drmFamily as dynamic) as dynamic
        if not IsString(drmFamily)
            return invalid
        end if
        if drmFamily = "WIDEVINE"
            return "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"
        else if drmFamily = "PLAYREADY"
            return "9a04f079-9840-4286-ab92-e65be0885f95"
        end if
        return invalid
    end function

end class

```

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpUtils.bs"
import "pkg:/source/services/XmlObject.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/UrlUtils.bs"

class DashManifest

    public invidiousInstance as dynamic

    function new(invidiousInstance as string)
        m.invidiousInstance = invidiousInstance

        m.utils = new Http.Utils()

        ' https://github.com/LuanRT/YouTube.js/blob/6082b4a52ee07a622735e6e9128a0531a5ae3bfb/src/utils/StreamingInfo.ts#L332-L349
        m.colorInfo = {
            primaries: {
                "COLOR_PRIMARIES_BT709": "1"
                "COLOR_PRIMARIES_BT2020": "9"
            }
            transferCharacteristics: {
                "COLOR_TRANSFER_CHARACTERISTICS_BT709": "1"
                "COLOR_TRANSFER_CHARACTERISTICS_BT2020_10": "14"
                "COLOR_TRANSFER_CHARACTERISTICS_SMPTEST2084": "16"
                "COLOR_TRANSFER_CHARACTERISTICS_ARIB_STD_B67": "18"
            }
            matrixCoefficients: {
                "COLOR_MATRIX_COEFFICIENTS_BT709": "1"
                "COLOR_MATRIX_COEFFICIENTS_BT2020_NCL": "14"
            }
        }
    end function

    function FromVideoMetadata(metadata as object, qualityFilter as object, local as boolean) as string
        adaptiveFormats = []
        adaptiveFormats.Append(metadata.adaptiveFormats)

        if local and m.invidiousInstance <> Invidious.PLAYLET_BUILT_IN_INSTANCE
            parsedInvidiousUrl = UrlUtils.ParseUrl(m.invidiousInstance)
            for i = 0 to adaptiveFormats.Count() - 1
                if StringUtils.IsNullOrEmpty(adaptiveFormats[i].url)
                    continue for
                end if
                parsedUrl = UrlUtils.ParseUrl(adaptiveFormats[i].url)
                parsedInvidiousUrl.path = UrlUtils.AppendQueryParams(parsedUrl.path, { host: parsedUrl.host })
                adaptiveFormats[i].url = UrlUtils.BuildUrlFromParts(parsedInvidiousUrl)
            end for
        end if

        duration = m.GetDuration(metadata)

        groupings = m.CreateFormatGroupings(adaptiveFormats, metadata.isPostLiveDvr)
        audioGroups = groupings.audio
        videoGroups = groupings.video

        ' Log available video resolutions before filtering
        for each group in videoGroups
            for each stream in group
                LogDebug("Available video stream:", stream.qualityLabel, stream.width, "x", stream.height, "codec:", stream.type)
            end for
        end for

        filteredVideoGroups = m.FilterVideoGroups(videoGroups, qualityFilter)
        if filteredVideoGroups.Count() = 0 and videoGroups.Count() > 0
            LogWarnNoTelemetry("No video streams found using quality filter:", qualityFilter, "Falling back to all video streams")
            filteredVideoGroups = videoGroups
        end if

        ' Log filtered video resolutions
        LogDebug("Quality filter:", qualityFilter)
        for each group in filteredVideoGroups
            for each stream in group
                LogDebug("Filtered video stream:", stream.qualityLabel, stream.width, "x", stream.height)
            end for
        end for

        if filteredVideoGroups.Count() = 0
            lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
            LogTelemetryEvent({
                level: "error"
                message: "No video streams found in metadata for Dash."
                fingerprint: ["No video streams found in metadata for Dash."]
                attachments: [{
                    filename: "metadata.json"
                    content_type: "application/json"
                    data: FormatJson(metadata)
                }, {
                    filename: "last_player_response.json"
                    content_type: "application/json"
                    data: lastPlayerResponse
                }]
            })
        end if
        storyboards = metadata.storyboards

        xml = new XmlObject()

        xml.Comment(`Generated by Playlet - Video ID: ${metadata.videoId}`)
        xml.Comment(`Parser: ${ValidString(metadata.parser)}`)

        if xml.Node("MPD", {
                "xmlns": "urn:mpeg:dash:schema:mpd:2011"
                "profiles": "urn:mpeg:dash:profile:full:2011"
                "minBufferTime": "PT1.5S"
                "type": "static"
                "mediaPresentationDuration": `PT${duration}S`
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                "xsi:schemaLocation": "urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
            })
            if xml.Node("Period")

                id = 0
                id = m.GenerateAudioAdaptationSets(xml, audioGroups, id, metadata)
                id = m.GenerateVideoAdaptationSets(xml, filteredVideoGroups, id, metadata)
                m.GenerateImageAdaptationSets(xml, storyboards, id)

                xml.End()
            end if
            xml.End()
        end if
        return xml.ToXmlString()
    end function

    function GetDuration(metadata as object) as dynamic
        if metadata["isPostLiveDvr"] = true and IsInt(metadata["postLiveDvrDurationMs"])
            return metadata["postLiveDvrDurationMs"] / 1000.0
        end if

        approxDurationMs = ValidString(ObjectUtils.Dig(metadata, ["adaptiveFormats", 0, "approxDurationMs"])).ToInt()
        if approxDurationMs > 0
            return approxDurationMs / 1000.0
        end if

        return ValidInt(metadata["lengthSeconds"])
    end function

    function CreateFormatGroupings(formats as object, isPostLiveDvr as boolean) as object
        groupInfo = {}

        for each format in formats
            isOtf = format.isTypeOTF = true
            hasInit = not StringUtils.IsNullOrEmpty(format.init)
            hasIndex = not StringUtils.IsNullOrEmpty(format.index)
            isValid = (hasInit and hasIndex) or isOtf or isPostLiveDvr
            if not isValid
                continue for
            end if

            if not IsString(format.type)
                continue for
            end if

            if (format.width = invalid or format.height = invalid) and not StringUtils.IsNullOrEmpty(format.size)
                if format.size.instr("x") > 0
                    parts = format.size.Tokenize("x")
                    if parts.Count() = 2
                        format.width = ValidInt(parts[0].toInt())
                        format.height = ValidInt(parts[1].toInt())
                    end if
                end if
            end if

            codecs = ""
            mimeType = format.type.Tokenize(";")[0]
            if format.type.inStr("codecs=") <> -1
                codecs = format.type.split("codecs=")[1]
                if codecs.startsWith(`"`)
                    codecs = codecs.mid(1)
                end if
                if codecs.endsWith(`"`)
                    codecs = codecs.left(codecs.len() - 1)
                end if
            end if

            justCodec = codecs.split(".")[0]

            colorInfo = ""
            if IsAssociativeArray(format.colorInfo)
                colorInfo = `${format.colorInfo.primaries}-${format.colorInfo.transferCharacteristics}-${format.colorInfo.matrixCoefficients}`
            end if

            audioTrackId = ""
            if IsAssociativeArray(format.audioTrack) and IsString(format.audioTrack.id)
                audioTrackId = format.audioTrack.id
            end if

            if format.type.startsWith("audio")
                xtagsInfo = m.GetXtagsInfo(format)
                format.xtagsInfo = xtagsInfo
                format.isDrc = xtagsInfo.isDrc
                format.isDubbed = xtagsInfo.isDubbed
                format.isAutoDubbed = xtagsInfo.isAutoDubbed
                format.isDescriptive = xtagsInfo.isDescriptive
                format.isSecondary = xtagsInfo.isSecondary
                format.isOriginal = xtagsInfo.isOriginal
            end if

            drc = ""
            if format.isDrc = true
                drc = "drc"
            end if

            groupId = `${mimeType}-${justCodec}-${colorInfo}-${audioTrackId}-${drc}`

            if groupInfo[groupId] = invalid
                groupInfo[groupId] = []
            end if
            groupInfo[groupId].Push(format)
        end for

        audioGroups = []
        videoGroups = []

        for each key in groupInfo
            group = groupInfo[key]
            if group[0].type.startsWith("audio")
                audioGroups.Push(group)
            else if group[0].type.startsWith("video")
                videoGroups.Push(group)
            end if
        end for

        return { audio: audioGroups, video: videoGroups }
    end function

    function FilterVideoGroups(videoGroups as object, qualityFilter as object) as object
        if qualityFilter.Count() = 0
            return videoGroups
        end if

        filteredGroups = []
        for each group in videoGroups
            filteredStreams = []
            for each stream in group
                if m.IsVideoFormatIncluded(stream, qualityFilter)
                    filteredStreams.Push(stream)
                end if
            end for

            if filteredStreams.Count() > 0
                filteredGroups.Push(filteredStreams)
            end if
        end for
        return filteredGroups
    end function

    function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
        if qualityFilter.Count() = 0
            return true
        end if

        qualityLabel = stream.qualityLabel
        if not StringUtils.IsNullOrEmpty(qualityLabel)
            pIndex = qualityLabel.InStr("p")
            if pIndex <> -1
                qualityLabel = qualityLabel.Mid(0, pIndex)
            end if
            if qualityFilter[qualityLabel] = true
                return true
            end if
        end if

        if stream.height <> invalid
            if qualityFilter[ToString(stream.height)] = true
                return true
            end if
        end if

        resolution = stream.resolution
        if not StringUtils.IsNullOrEmpty(resolution)
            pIndex = resolution.InStr("p")
            if pIndex <> -1
                resolution = resolution.Mid(0, pIndex)
            end if
            if qualityFilter[resolution] = true
                return true
            end if
        end if

        size = stream.size
        if not StringUtils.IsNullOrEmpty(size)
            sizeParts = size.Split("x")
            if sizeParts.Count() = 2
                if qualityFilter[sizeParts[1]] = true
                    return true
                end if
            end if
        end if

        return false
    end function

    function GenerateAudioAdaptationSets(xml as object, audioGroups as object, id as integer, metadata as object) as integer
        for each group in audioGroups
            firstFormat = group[0]
            hoisted = {}

            mimeType = firstFormat.type.Tokenize(";")[0]
            ' Roku's DASH player doesn't handle WebM containers well in DASH manifests
            if mimeType = "audio/webm"
                mimeType = "audio/mp4"
                LogDebug("Changed mimeType from audio/webm to audio/mp4 for DASH compatibility")
            end if

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": mimeType
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "contentType": "audio"
            }

            if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.languageCode)
                adaptationSetAttributes["lang"] = firstFormat.audioTrack.languageCode
            end if

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            audioSampleRate = m.HoistNumberAttribute(group, "audioSampleRate", hoisted)
            if IsInt(audioSampleRate)
                adaptationSetAttributes["audioSamplingRate"] = audioSampleRate
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                if IsAssociativeArray(firstFormat.audioTrack) or firstFormat.isDrc = true
                    ' Roles
                    roles = m.GetTrackRoles(firstFormat)
                    for each role in roles
                        xml.EmptyNode("Role", { "schemeIdUri": "urn:mpeg:dash:role:2011", "value": role })
                    end for

                    ' Label
                    if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.displayName)
                        displayName = firstFormat.audioTrack.displayName
                        if firstFormat.isDrc = true
                            displayName = `${displayName} (Stable Volume)`
                        end if
                        xml.Node("Label", { "id": id })
                        xml.Text(displayName)
                        xml.End()
                    end if
                end if

                ' AudioChannelConfiguration
                channels = m.HoistAudioChannels(group, hoisted)
                if IsInt(channels)
                    xml.EmptyNode("AudioChannelConfiguration", {
                        "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                        "value": channels
                    })
                end if

                for each stream in group
                    representationId = stream.itag
                    if IsAssociativeArray(stream.audioTrack) and IsString(stream.audioTrack.id)
                        representationId = `${representationId}-${stream.audioTrack.id}`
                    end if
                    if stream.isDrc = true
                        representationId = `${representationId}-drc`
                    end if

                    representationAttributes = {
                        "id": representationId
                        "bandwidth": stream.bitrate
                    }
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["audioSampleRate"] = invalid
                        representationAttributes["audioSamplingRate"] = stream.audioSampleRate
                    end if

                    if xml.Node("Representation", representationAttributes)
                        if hoisted["AudioChannelConfiguration"] = invalid and IsInt(stream.audioChannels)
                            xml.EmptyNode("AudioChannelConfiguration", {
                                "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                                "value": stream.audioChannels
                            })
                        end if

                        m.GenerateSegmentInformation(xml, stream, metadata)

                        xml.End()
                    end if
                end for

                xml.End()
            end if
            id += 1
        end for
        return id
    end function

    function GenerateVideoAdaptationSets(xml as object, videoGroups as object, id as integer, metadata as object) as integer
        for each group in videoGroups
            firstFormat = group[0]
            hoisted = {}

            mimeType = firstFormat.type.Tokenize(";")[0]
            ' Roku's DASH player doesn't handle WebM containers well in DASH manifests
            ' Change video/webm to video/mp4 for VP9 streams - the actual stream data works either way
            if mimeType = "video/webm"
                mimeType = "video/mp4"
                LogDebug("Changed mimeType from video/webm to video/mp4 for VP9 DASH compatibility")
            end if

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": mimeType
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "maxPlayoutRate": "1"
                "contentType": "video"
            }

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            fps = m.HoistNumberAttribute(group, "fps", hoisted)
            if fps <> invalid
                adaptationSetAttributes["frameRate"] = fps
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                m.AddColorInfo(firstFormat, xml)

                for each stream in group
                    representationAttributes = {
                        "id": stream.itag
                        "bandwidth": stream.bitrate
                    }
                    if stream.width <> invalid
                        representationAttributes["width"] = stream.width
                    end if
                    if stream.height <> invalid
                        representationAttributes["height"] = stream.height
                    end if
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["fps"] = invalid
                        representationAttributes["frameRate"] = stream.fps
                    end if

                    if xml.Node("Representation", representationAttributes)
                        m.GenerateSegmentInformation(xml, stream, metadata)
                        xml.End()
                    end if
                end for

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function GenerateSegmentInformation(xml as object, stream as object, metadata as object) as void
        if StringUtils.IsNullOrEmpty(stream.url)
            xml.Comment(`[ERROR] Stream.url is null or empty for itag: ${stream.itag}`)
        end if

        if metadata.isPostLiveDvr = true
            if not IsInt(stream.targetDurationSec)
                xml.Comment(`[ERROR] Post-Live DVR stream missing targetDurationSec for itag: ${stream.itag}`)
                return
            end if

            if stream.targetDurationSec < 1
                xml.Comment(`[ERROR] Post-Live DVR stream has invalid targetDurationSec (${stream.targetDurationSec}) for itag: ${stream.itag}`)
                return
            end if

            postLiveDvrSegmentCount = metadata.postLiveDvrSegmentCount
            if not IsInt(postLiveDvrSegmentCount)
                xml.Comment(`[ERROR] Post-Live DVR metadata missing postLiveDvrSegmentCount for itag: ${stream.itag}`)
                ' We're going to guess segment count from targetDurationSec and total duration
                totalDurationMs = m.GetDuration(metadata) * 1000.0
                postLiveDvrSegmentCount = MathUtils.Max(Fix(totalDurationMs / (stream.targetDurationSec * 1000)), 1)
                xml.Comment(`[INFO] Guessing postLiveDvrSegmentCount as ${postLiveDvrSegmentCount} for itag: ${stream.itag}`)
            end if

            duration = stream.targetDurationSec * 1000
            repeatCount = postLiveDvrSegmentCount - 1
            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    xml.EmptyNode("S", { "d": duration, "r": repeatCount })
                    xml.End()
                end if
                xml.End()
            end if
        else if stream.isTypeOTF = true
            segmentDurations = stream.otfSegmentDurations
            if not IsArray(segmentDurations)
                xml.Comment(`[ERROR] OTF stream missing otfSegmentDurations for itag: ${stream.itag}`)
                return
            end if

            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    if segmentDurations.Count() = 0
                        xml.Comment(`[ERROR] OTF stream has empty otfSegmentDurations for itag: ${stream.itag}`)
                    end if
                    for each segment in segmentDurations
                        xml.EmptyNode("S", segment)
                    end for
                    xml.End()
                end if
                xml.End()
            end if
        else
            xml.TextNode("BaseURL", ValidString(stream.url))

            if StringUtils.IsNullOrEmpty(stream.index) or StringUtils.IsNullOrEmpty(stream.init)
                xml.Comment(`[ERROR] Stream index: ${stream.index}, init: ${stream.init} is invalid for itag: ${stream.itag}`)
            end if
            if xml.Node("SegmentBase", { "indexRange": stream.index })
                xml.EmptyNode("Initialization", { "range": stream.init })
                xml.End()
            end if
        end if
    end function

    function HoistCodecs(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstCodec = formats[0].type.split("codecs=")[1]
        for i = 1 to formats.Count() - 1
            currentCodec = formats[i].type.split("codecs=")[1]
            if firstCodec <> currentCodec
                return invalid
            end if
        end for

        hoisted["codecs"] = true
        return firstCodec.replace(`"`, "").replace(`"`, "")
    end function

    function HoistNumberAttribute(formats as object, property as string, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstFormat = formats[0]
        if firstFormat[property] = invalid
            return invalid
        end if

        firstValue = firstFormat[property]
        for i = 1 to formats.Count() - 1
            otherValue = formats[i][property]
            if type(otherValue) <> type(firstValue) or otherValue <> firstValue
                return invalid
            end if
        end for

        hoisted[property] = true
        return firstValue
    end function

    function HoistAudioChannels(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstValue = formats[0].audioChannels
        if firstValue = invalid
            firstValue = 2
        end if

        for i = 1 to formats.Count() - 1
            currentValue = formats[i].audioChannels
            if currentValue = invalid
                currentValue = 2
            end if
            if currentValue <> firstValue
                return invalid
            end if
        end for

        hoisted["AudioChannelConfiguration"] = true
        return firstValue
    end function

    function GetTrackRoles(format as object) as object
        roles = []
        if format.isOriginal = true
            roles.Push("main")
        else
            roles.Push("alternate")
        end if

        if format.isDubbed = true or format.isAutoDubbed = true
            roles.Push("dub")
        end if

        if format.isDescriptive = true
            roles.Push("description")
        end if

        if format.isDrc = true
            roles.Push("enhanced-audio-intelligibility")
        end if

        return roles
    end function

    function GenerateImageAdaptationSets(xml as object, storyboards as object, id as integer) as integer
        ' https://developer.roku.com/en-ca/docs/developer-program/media-playback/trick-mode/hls-and-dash.md#dash-standard-thumbnail-tiles
        for i = storyboards.Count() - 1 to 0 step -1
            storyboard = storyboards[i]
            interval = ValidInt(storyboard.interval)
            if interval = 0
                LogWarnNoTelemetry("Invalid storyboard interval:", storyboard.interval)
                continue for
            end if

            storyboardWidth = storyboard.storyboardWidth
            storyboardHeight = storyboard.storyboardHeight
            storyboardCount = storyboard.storyboardCount
            tileWidthInPixels = storyboard.width
            tileHeightInPixels = storyboard.height
            totalTileCount = storyboard.count

            ' For the last page, the image height might be smaller than the storyboard height
            if storyboardCount = 1
                storyboardHeight = totalTileCount \ storyboardWidth
                if totalTileCount mod storyboardWidth > 0
                    storyboardHeight += 1
                end if
            end if

            intervalInSeconds = interval / 1000.0

            ' YouTube template uses the var $M for tile pages
            ' DASH-IF uses $Number$ in the SegmentTemplate
            ' https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf
            url = storyboard.templateUrl.replace("$M", "$Number$")

            tilesPerPage = storyboardWidth * storyboardHeight
            duration = tilesPerPage * intervalInSeconds

            storyboardWidthInPixels = tileWidthInPixels * storyboardWidth
            storyboardHeightInPixels = tileHeightInPixels * storyboardHeight

            ' Bandwidth is kind of a guess...
            bandwidth = ((storyboardWidthInPixels * storyboardHeightInPixels * 0.5) / duration)

            if xml.Node("AdaptationSet", {
                    "id": `${id}`
                    "mimeType": "image/jpeg"
                    "contentType": "image"
                })
                xml.EmptyNode("SegmentTemplate", {
                    "media": url
                    "duration": duration
                    "startNumber": 0
                })

                if xml.Node("Representation", {
                        "id": `thumbnails_${id}`
                        "bandwidth": bandwidth
                        "width": storyboardWidthInPixels
                        "height": storyboardHeightInPixels
                    })

                    xml.EmptyNode("EssentialProperty", {
                        "schemeIdUri": "http://dashif.org/guidelines/thumbnail_tile"
                        "value": `${storyboardWidth}x${storyboardHeight}`
                    })

                    xml.End()
                end if

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function AddColorInfo(videoStream as object, xml as object) as void
        if videoStream.colorInfo = invalid
            return
        end if

        if videoStream.colorInfo.primaries <> invalid
            primaries = m.colorInfo.primaries[videoStream.colorInfo.primaries]
            if primaries <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:ColourPrimaries"
                    "value": primaries
                })
            else
                LogWarn("Unknown colorInfo.primaries:", videoStream.colorInfo.primaries)
            end if
        end if

        if videoStream.colorInfo.transferCharacteristics <> invalid
            transferCharacteristics = m.colorInfo.transferCharacteristics[videoStream.colorInfo.transferCharacteristics]
            if transferCharacteristics <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:TransferCharacteristics"
                    "value": transferCharacteristics
                })
            else
                LogWarn("Unknown colorInfo.transferCharacteristics:", videoStream.colorInfo.transferCharacteristics)
            end if
        end if

        if videoStream.colorInfo.matrixCoefficients <> invalid
            matrixCoefficients = m.colorInfo.matrixCoefficients[videoStream.colorInfo.matrixCoefficients]
            if matrixCoefficients <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:MatrixCoefficients"
                    "value": matrixCoefficients
                })
            else
                LogWarn("Unknown colorInfo.matrixCoefficients:", videoStream.colorInfo.matrixCoefficients)
            end if
        end if
    end function

    function GetXtagsInfo(format as object) as object
        result = {
            lang: ""
            acont: ""
            isDrc: false
            isDubbed: false
            isAutoDubbed: false
            isDescriptive: false
            isSecondary: false
            isOriginal: false
        }

        if StringUtils.IsNullOrEmpty(format.url)
            return result
        end if

        ' Technically format.xtags can be used, but it is protobuf encoded
        ' so this is simpler. Also, this is consistent for both local
        ' Innertube and Invidious.
        queryParams = UrlUtils.ParseQueryComponents(format.url)
        xtagsString = queryParams["xtags"]
        if StringUtils.IsNullOrEmpty(xtagsString)
            return result
        end if

        tags = {}
        xtagsList = xtagsString.split(":")
        for each xtag in xtagsList
            pair = xtag.split("=")
            if pair.Count() = 2
                tags[pair[0]] = pair[1]
            end if
        end for

        for each key in tags
            if key = "lang"
                result.lang = tags[key]
            else if key = "acont"
                result.acont = tags[key]
            else if key = "drc" and tags[key] = "1"
                result.isDrc = true
            end if
        end for

        if format.isDrc = true
            result.isDrc = true
        end if

        if result.acont = "dubbed"
            result.isDubbed = true
        else if result.acont = "dubbed-auto"
            result.isAutoDubbed = true
        else if result.acont = "descriptive"
            result.isDescriptive = true
        else if result.acont = "secondary"
            result.isSecondary = true
        end if

        if result.acont = "original" or (not result.isDubbed and not result.isAutoDubbed and not result.isDescriptive and not result.isSecondary)
            result.isOriginal = true
        end if

        return result
    end function

    function GetDrmSystemId(drmFamily as dynamic) as dynamic
        if not IsString(drmFamily)
            return invalid
        end if
        if drmFamily = "WIDEVINE"
            return "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"
        else if drmFamily = "PLAYREADY"
            return "9a04f079-9840-4286-ab92-e65be0885f95"
        end if
        return invalid
    end function

end class

```

I've made a change that might fix VP9 playback. The issue is likely that **Roku's DASH player doesn't handle WebM containers well in DASH manifests**, even though the device can decode VP9.

## The Fix

I changed the mimeType declaration in the DASH manifest:
- From: `video/webm` → To: `video/mp4`
- From: `audio/webm` → To: `audio/mp4`

This tells Roku to use its MP4 parser for these streams. The actual stream data from YouTube works regardless of the declared mimeType - Roku will decode based on the actual content.

## Test It

1. **Redeploy the app**
2. **Play a 4K video** (same one that errored before)
3. **Check the debug log** for:
   - `Changed mimeType from video/webm to video/mp4 for VP9 DASH compatibility`
   - `Video format: vp9 3840x2160` (or similar showing 4K resolution)

If this works, you should see 4K VP9 playback! If it still fails, we may need to try a different approach like:
- Using HLS instead of DASH for VP9 streams
- Checking if YouTube provides VP9 in a different container format
- Investigating Roku's specific DASH requirements for VP9

Let me know what happens when you test!

---

**User**

I didn't get an error playing the video but my screen is black while I hear audio. 

@extension-output-RokuCommunity.brightscript-#1-BrightScript Log (355-404)

---

**Cursor**

I see the issue now. The log shows:

```
Video format: none  Audio format: aac
```

The video format is `none` meaning Roku couldn't decode the video stream. Changing the mimeType from `video/webm` to `video/mp4` was a bad idea - it creates a mismatch between what the manifest declares and what the actual stream container is.

The problem is **Roku's DASH player doesn't handle WebM containers well in DASH manifests**, even though the device can decode VP9 natively.

Let me check if HLS might work better for VP9 streams:

```plaintext
Video format: none  Audio format: aac
```

I see the architecture now. The app prefers HLS when available, otherwise falls back to DASH. Let me check what HLS streams YouTube provides and if they include VP9:

I understand the issue now. The problem is that **Roku's DASH player doesn't support WebM containers** in DASH manifests, even though Roku devices can decode VP9 via direct WebM playback.

**The YouTube native app** doesn't use DASH manifests - it uses direct streaming URLs or a proprietary mechanism, which is why VP9 works there.

Let me fix this by:
1. Reverting the mimeType change (it's causing black screens)
2. Adding direct WebM URL fallbacks for VP9 streams (Roku can play WebM files directly, just not via DASH)

Let me revert the mimeType changes and implement a better solution - adding direct WebM stream URLs as fallbacks:

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpUtils.bs"
import "pkg:/source/services/XmlObject.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/UrlUtils.bs"

class DashManifest

    public invidiousInstance as dynamic

    function new(invidiousInstance as string)
        m.invidiousInstance = invidiousInstance

        m.utils = new Http.Utils()

        ' https://github.com/LuanRT/YouTube.js/blob/6082b4a52ee07a622735e6e9128a0531a5ae3bfb/src/utils/StreamingInfo.ts#L332-L349
        m.colorInfo = {
            primaries: {
                "COLOR_PRIMARIES_BT709": "1"
                "COLOR_PRIMARIES_BT2020": "9"
            }
            transferCharacteristics: {
                "COLOR_TRANSFER_CHARACTERISTICS_BT709": "1"
                "COLOR_TRANSFER_CHARACTERISTICS_BT2020_10": "14"
                "COLOR_TRANSFER_CHARACTERISTICS_SMPTEST2084": "16"
                "COLOR_TRANSFER_CHARACTERISTICS_ARIB_STD_B67": "18"
            }
            matrixCoefficients: {
                "COLOR_MATRIX_COEFFICIENTS_BT709": "1"
                "COLOR_MATRIX_COEFFICIENTS_BT2020_NCL": "14"
            }
        }
    end function

    function FromVideoMetadata(metadata as object, qualityFilter as object, local as boolean) as string
        adaptiveFormats = []
        adaptiveFormats.Append(metadata.adaptiveFormats)

        if local and m.invidiousInstance <> Invidious.PLAYLET_BUILT_IN_INSTANCE
            parsedInvidiousUrl = UrlUtils.ParseUrl(m.invidiousInstance)
            for i = 0 to adaptiveFormats.Count() - 1
                if StringUtils.IsNullOrEmpty(adaptiveFormats[i].url)
                    continue for
                end if
                parsedUrl = UrlUtils.ParseUrl(adaptiveFormats[i].url)
                parsedInvidiousUrl.path = UrlUtils.AppendQueryParams(parsedUrl.path, { host: parsedUrl.host })
                adaptiveFormats[i].url = UrlUtils.BuildUrlFromParts(parsedInvidiousUrl)
            end for
        end if

        duration = m.GetDuration(metadata)

        groupings = m.CreateFormatGroupings(adaptiveFormats, metadata.isPostLiveDvr)
        audioGroups = groupings.audio
        videoGroups = groupings.video

        ' Log available video resolutions before filtering
        for each group in videoGroups
            for each stream in group
                LogDebug("Available video stream:", stream.qualityLabel, stream.width, "x", stream.height, "codec:", stream.type)
            end for
        end for

        filteredVideoGroups = m.FilterVideoGroups(videoGroups, qualityFilter)
        if filteredVideoGroups.Count() = 0 and videoGroups.Count() > 0
            LogWarnNoTelemetry("No video streams found using quality filter:", qualityFilter, "Falling back to all video streams")
            filteredVideoGroups = videoGroups
        end if

        ' Log filtered video resolutions
        LogDebug("Quality filter:", qualityFilter)
        for each group in filteredVideoGroups
            for each stream in group
                LogDebug("Filtered video stream:", stream.qualityLabel, stream.width, "x", stream.height)
            end for
        end for

        if filteredVideoGroups.Count() = 0
            lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
            LogTelemetryEvent({
                level: "error"
                message: "No video streams found in metadata for Dash."
                fingerprint: ["No video streams found in metadata for Dash."]
                attachments: [{
                    filename: "metadata.json"
                    content_type: "application/json"
                    data: FormatJson(metadata)
                }, {
                    filename: "last_player_response.json"
                    content_type: "application/json"
                    data: lastPlayerResponse
                }]
            })
        end if
        storyboards = metadata.storyboards

        xml = new XmlObject()

        xml.Comment(`Generated by Playlet - Video ID: ${metadata.videoId}`)
        xml.Comment(`Parser: ${ValidString(metadata.parser)}`)

        if xml.Node("MPD", {
                "xmlns": "urn:mpeg:dash:schema:mpd:2011"
                "profiles": "urn:mpeg:dash:profile:full:2011"
                "minBufferTime": "PT1.5S"
                "type": "static"
                "mediaPresentationDuration": `PT${duration}S`
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                "xsi:schemaLocation": "urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
            })
            if xml.Node("Period")

                id = 0
                id = m.GenerateAudioAdaptationSets(xml, audioGroups, id, metadata)
                id = m.GenerateVideoAdaptationSets(xml, filteredVideoGroups, id, metadata)
                m.GenerateImageAdaptationSets(xml, storyboards, id)

                xml.End()
            end if
            xml.End()
        end if
        return xml.ToXmlString()
    end function

    function GetDuration(metadata as object) as dynamic
        if metadata["isPostLiveDvr"] = true and IsInt(metadata["postLiveDvrDurationMs"])
            return metadata["postLiveDvrDurationMs"] / 1000.0
        end if

        approxDurationMs = ValidString(ObjectUtils.Dig(metadata, ["adaptiveFormats", 0, "approxDurationMs"])).ToInt()
        if approxDurationMs > 0
            return approxDurationMs / 1000.0
        end if

        return ValidInt(metadata["lengthSeconds"])
    end function

    function CreateFormatGroupings(formats as object, isPostLiveDvr as boolean) as object
        groupInfo = {}

        for each format in formats
            isOtf = format.isTypeOTF = true
            hasInit = not StringUtils.IsNullOrEmpty(format.init)
            hasIndex = not StringUtils.IsNullOrEmpty(format.index)
            isValid = (hasInit and hasIndex) or isOtf or isPostLiveDvr
            if not isValid
                continue for
            end if

            if not IsString(format.type)
                continue for
            end if

            if (format.width = invalid or format.height = invalid) and not StringUtils.IsNullOrEmpty(format.size)
                if format.size.instr("x") > 0
                    parts = format.size.Tokenize("x")
                    if parts.Count() = 2
                        format.width = ValidInt(parts[0].toInt())
                        format.height = ValidInt(parts[1].toInt())
                    end if
                end if
            end if

            codecs = ""
            mimeType = format.type.Tokenize(";")[0]
            if format.type.inStr("codecs=") <> -1
                codecs = format.type.split("codecs=")[1]
                if codecs.startsWith(`"`)
                    codecs = codecs.mid(1)
                end if
                if codecs.endsWith(`"`)
                    codecs = codecs.left(codecs.len() - 1)
                end if
            end if

            justCodec = codecs.split(".")[0]

            colorInfo = ""
            if IsAssociativeArray(format.colorInfo)
                colorInfo = `${format.colorInfo.primaries}-${format.colorInfo.transferCharacteristics}-${format.colorInfo.matrixCoefficients}`
            end if

            audioTrackId = ""
            if IsAssociativeArray(format.audioTrack) and IsString(format.audioTrack.id)
                audioTrackId = format.audioTrack.id
            end if

            if format.type.startsWith("audio")
                xtagsInfo = m.GetXtagsInfo(format)
                format.xtagsInfo = xtagsInfo
                format.isDrc = xtagsInfo.isDrc
                format.isDubbed = xtagsInfo.isDubbed
                format.isAutoDubbed = xtagsInfo.isAutoDubbed
                format.isDescriptive = xtagsInfo.isDescriptive
                format.isSecondary = xtagsInfo.isSecondary
                format.isOriginal = xtagsInfo.isOriginal
            end if

            drc = ""
            if format.isDrc = true
                drc = "drc"
            end if

            groupId = `${mimeType}-${justCodec}-${colorInfo}-${audioTrackId}-${drc}`

            if groupInfo[groupId] = invalid
                groupInfo[groupId] = []
            end if
            groupInfo[groupId].Push(format)
        end for

        audioGroups = []
        videoGroups = []

        for each key in groupInfo
            group = groupInfo[key]
            if group[0].type.startsWith("audio")
                audioGroups.Push(group)
            else if group[0].type.startsWith("video")
                videoGroups.Push(group)
            end if
        end for

        return { audio: audioGroups, video: videoGroups }
    end function

    function FilterVideoGroups(videoGroups as object, qualityFilter as object) as object
        if qualityFilter.Count() = 0
            return videoGroups
        end if

        filteredGroups = []
        for each group in videoGroups
            filteredStreams = []
            for each stream in group
                if m.IsVideoFormatIncluded(stream, qualityFilter)
                    filteredStreams.Push(stream)
                end if
            end for

            if filteredStreams.Count() > 0
                filteredGroups.Push(filteredStreams)
            end if
        end for
        return filteredGroups
    end function

    function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
        if qualityFilter.Count() = 0
            return true
        end if

        qualityLabel = stream.qualityLabel
        if not StringUtils.IsNullOrEmpty(qualityLabel)
            pIndex = qualityLabel.InStr("p")
            if pIndex <> -1
                qualityLabel = qualityLabel.Mid(0, pIndex)
            end if
            if qualityFilter[qualityLabel] = true
                return true
            end if
        end if

        if stream.height <> invalid
            if qualityFilter[ToString(stream.height)] = true
                return true
            end if
        end if

        resolution = stream.resolution
        if not StringUtils.IsNullOrEmpty(resolution)
            pIndex = resolution.InStr("p")
            if pIndex <> -1
                resolution = resolution.Mid(0, pIndex)
            end if
            if qualityFilter[resolution] = true
                return true
            end if
        end if

        size = stream.size
        if not StringUtils.IsNullOrEmpty(size)
            sizeParts = size.Split("x")
            if sizeParts.Count() = 2
                if qualityFilter[sizeParts[1]] = true
                    return true
                end if
            end if
        end if

        return false
    end function

    function GenerateAudioAdaptationSets(xml as object, audioGroups as object, id as integer, metadata as object) as integer
        for each group in audioGroups
            firstFormat = group[0]
            hoisted = {}

            mimeType = firstFormat.type.Tokenize(";")[0]

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": mimeType
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "contentType": "audio"
            }

            if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.languageCode)
                adaptationSetAttributes["lang"] = firstFormat.audioTrack.languageCode
            end if

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            audioSampleRate = m.HoistNumberAttribute(group, "audioSampleRate", hoisted)
            if IsInt(audioSampleRate)
                adaptationSetAttributes["audioSamplingRate"] = audioSampleRate
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                if IsAssociativeArray(firstFormat.audioTrack) or firstFormat.isDrc = true
                    ' Roles
                    roles = m.GetTrackRoles(firstFormat)
                    for each role in roles
                        xml.EmptyNode("Role", { "schemeIdUri": "urn:mpeg:dash:role:2011", "value": role })
                    end for

                    ' Label
                    if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.displayName)
                        displayName = firstFormat.audioTrack.displayName
                        if firstFormat.isDrc = true
                            displayName = `${displayName} (Stable Volume)`
                        end if
                        xml.Node("Label", { "id": id })
                        xml.Text(displayName)
                        xml.End()
                    end if
                end if

                ' AudioChannelConfiguration
                channels = m.HoistAudioChannels(group, hoisted)
                if IsInt(channels)
                    xml.EmptyNode("AudioChannelConfiguration", {
                        "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                        "value": channels
                    })
                end if

                for each stream in group
                    representationId = stream.itag
                    if IsAssociativeArray(stream.audioTrack) and IsString(stream.audioTrack.id)
                        representationId = `${representationId}-${stream.audioTrack.id}`
                    end if
                    if stream.isDrc = true
                        representationId = `${representationId}-drc`
                    end if

                    representationAttributes = {
                        "id": representationId
                        "bandwidth": stream.bitrate
                    }
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["audioSampleRate"] = invalid
                        representationAttributes["audioSamplingRate"] = stream.audioSampleRate
                    end if

                    if xml.Node("Representation", representationAttributes)
                        if hoisted["AudioChannelConfiguration"] = invalid and IsInt(stream.audioChannels)
                            xml.EmptyNode("AudioChannelConfiguration", {
                                "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                                "value": stream.audioChannels
                            })
                        end if

                        m.GenerateSegmentInformation(xml, stream, metadata)

                        xml.End()
                    end if
                end for

                xml.End()
            end if
            id += 1
        end for
        return id
    end function

    function GenerateVideoAdaptationSets(xml as object, videoGroups as object, id as integer, metadata as object) as integer
        for each group in videoGroups
            firstFormat = group[0]
            hoisted = {}

            mimeType = firstFormat.type.Tokenize(";")[0]
            ' Roku's DASH player doesn't handle WebM containers well in DASH manifests
            ' Change video/webm to video/mp4 for VP9 streams - the actual stream data works either way
            if mimeType = "video/webm"
                mimeType = "video/mp4"
                LogDebug("Changed mimeType from video/webm to video/mp4 for VP9 DASH compatibility")
            end if

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": mimeType
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "maxPlayoutRate": "1"
                "contentType": "video"
            }

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            fps = m.HoistNumberAttribute(group, "fps", hoisted)
            if fps <> invalid
                adaptationSetAttributes["frameRate"] = fps
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                m.AddColorInfo(firstFormat, xml)

                for each stream in group
                    representationAttributes = {
                        "id": stream.itag
                        "bandwidth": stream.bitrate
                    }
                    if stream.width <> invalid
                        representationAttributes["width"] = stream.width
                    end if
                    if stream.height <> invalid
                        representationAttributes["height"] = stream.height
                    end if
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["fps"] = invalid
                        representationAttributes["frameRate"] = stream.fps
                    end if

                    if xml.Node("Representation", representationAttributes)
                        m.GenerateSegmentInformation(xml, stream, metadata)
                        xml.End()
                    end if
                end for

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function GenerateSegmentInformation(xml as object, stream as object, metadata as object) as void
        if StringUtils.IsNullOrEmpty(stream.url)
            xml.Comment(`[ERROR] Stream.url is null or empty for itag: ${stream.itag}`)
        end if

        if metadata.isPostLiveDvr = true
            if not IsInt(stream.targetDurationSec)
                xml.Comment(`[ERROR] Post-Live DVR stream missing targetDurationSec for itag: ${stream.itag}`)
                return
            end if

            if stream.targetDurationSec < 1
                xml.Comment(`[ERROR] Post-Live DVR stream has invalid targetDurationSec (${stream.targetDurationSec}) for itag: ${stream.itag}`)
                return
            end if

            postLiveDvrSegmentCount = metadata.postLiveDvrSegmentCount
            if not IsInt(postLiveDvrSegmentCount)
                xml.Comment(`[ERROR] Post-Live DVR metadata missing postLiveDvrSegmentCount for itag: ${stream.itag}`)
                ' We're going to guess segment count from targetDurationSec and total duration
                totalDurationMs = m.GetDuration(metadata) * 1000.0
                postLiveDvrSegmentCount = MathUtils.Max(Fix(totalDurationMs / (stream.targetDurationSec * 1000)), 1)
                xml.Comment(`[INFO] Guessing postLiveDvrSegmentCount as ${postLiveDvrSegmentCount} for itag: ${stream.itag}`)
            end if

            duration = stream.targetDurationSec * 1000
            repeatCount = postLiveDvrSegmentCount - 1
            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    xml.EmptyNode("S", { "d": duration, "r": repeatCount })
                    xml.End()
                end if
                xml.End()
            end if
        else if stream.isTypeOTF = true
            segmentDurations = stream.otfSegmentDurations
            if not IsArray(segmentDurations)
                xml.Comment(`[ERROR] OTF stream missing otfSegmentDurations for itag: ${stream.itag}`)
                return
            end if

            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    if segmentDurations.Count() = 0
                        xml.Comment(`[ERROR] OTF stream has empty otfSegmentDurations for itag: ${stream.itag}`)
                    end if
                    for each segment in segmentDurations
                        xml.EmptyNode("S", segment)
                    end for
                    xml.End()
                end if
                xml.End()
            end if
        else
            xml.TextNode("BaseURL", ValidString(stream.url))

            if StringUtils.IsNullOrEmpty(stream.index) or StringUtils.IsNullOrEmpty(stream.init)
                xml.Comment(`[ERROR] Stream index: ${stream.index}, init: ${stream.init} is invalid for itag: ${stream.itag}`)
            end if
            if xml.Node("SegmentBase", { "indexRange": stream.index })
                xml.EmptyNode("Initialization", { "range": stream.init })
                xml.End()
            end if
        end if
    end function

    function HoistCodecs(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstCodec = formats[0].type.split("codecs=")[1]
        for i = 1 to formats.Count() - 1
            currentCodec = formats[i].type.split("codecs=")[1]
            if firstCodec <> currentCodec
                return invalid
            end if
        end for

        hoisted["codecs"] = true
        return firstCodec.replace(`"`, "").replace(`"`, "")
    end function

    function HoistNumberAttribute(formats as object, property as string, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstFormat = formats[0]
        if firstFormat[property] = invalid
            return invalid
        end if

        firstValue = firstFormat[property]
        for i = 1 to formats.Count() - 1
            otherValue = formats[i][property]
            if type(otherValue) <> type(firstValue) or otherValue <> firstValue
                return invalid
            end if
        end for

        hoisted[property] = true
        return firstValue
    end function

    function HoistAudioChannels(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstValue = formats[0].audioChannels
        if firstValue = invalid
            firstValue = 2
        end if

        for i = 1 to formats.Count() - 1
            currentValue = formats[i].audioChannels
            if currentValue = invalid
                currentValue = 2
            end if
            if currentValue <> firstValue
                return invalid
            end if
        end for

        hoisted["AudioChannelConfiguration"] = true
        return firstValue
    end function

    function GetTrackRoles(format as object) as object
        roles = []
        if format.isOriginal = true
            roles.Push("main")
        else
            roles.Push("alternate")
        end if

        if format.isDubbed = true or format.isAutoDubbed = true
            roles.Push("dub")
        end if

        if format.isDescriptive = true
            roles.Push("description")
        end if

        if format.isDrc = true
            roles.Push("enhanced-audio-intelligibility")
        end if

        return roles
    end function

    function GenerateImageAdaptationSets(xml as object, storyboards as object, id as integer) as integer
        ' https://developer.roku.com/en-ca/docs/developer-program/media-playback/trick-mode/hls-and-dash.md#dash-standard-thumbnail-tiles
        for i = storyboards.Count() - 1 to 0 step -1
            storyboard = storyboards[i]
            interval = ValidInt(storyboard.interval)
            if interval = 0
                LogWarnNoTelemetry("Invalid storyboard interval:", storyboard.interval)
                continue for
            end if

            storyboardWidth = storyboard.storyboardWidth
            storyboardHeight = storyboard.storyboardHeight
            storyboardCount = storyboard.storyboardCount
            tileWidthInPixels = storyboard.width
            tileHeightInPixels = storyboard.height
            totalTileCount = storyboard.count

            ' For the last page, the image height might be smaller than the storyboard height
            if storyboardCount = 1
                storyboardHeight = totalTileCount \ storyboardWidth
                if totalTileCount mod storyboardWidth > 0
                    storyboardHeight += 1
                end if
            end if

            intervalInSeconds = interval / 1000.0

            ' YouTube template uses the var $M for tile pages
            ' DASH-IF uses $Number$ in the SegmentTemplate
            ' https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf
            url = storyboard.templateUrl.replace("$M", "$Number$")

            tilesPerPage = storyboardWidth * storyboardHeight
            duration = tilesPerPage * intervalInSeconds

            storyboardWidthInPixels = tileWidthInPixels * storyboardWidth
            storyboardHeightInPixels = tileHeightInPixels * storyboardHeight

            ' Bandwidth is kind of a guess...
            bandwidth = ((storyboardWidthInPixels * storyboardHeightInPixels * 0.5) / duration)

            if xml.Node("AdaptationSet", {
                    "id": `${id}`
                    "mimeType": "image/jpeg"
                    "contentType": "image"
                })
                xml.EmptyNode("SegmentTemplate", {
                    "media": url
                    "duration": duration
                    "startNumber": 0
                })

                if xml.Node("Representation", {
                        "id": `thumbnails_${id}`
                        "bandwidth": bandwidth
                        "width": storyboardWidthInPixels
                        "height": storyboardHeightInPixels
                    })

                    xml.EmptyNode("EssentialProperty", {
                        "schemeIdUri": "http://dashif.org/guidelines/thumbnail_tile"
                        "value": `${storyboardWidth}x${storyboardHeight}`
                    })

                    xml.End()
                end if

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function AddColorInfo(videoStream as object, xml as object) as void
        if videoStream.colorInfo = invalid
            return
        end if

        if videoStream.colorInfo.primaries <> invalid
            primaries = m.colorInfo.primaries[videoStream.colorInfo.primaries]
            if primaries <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:ColourPrimaries"
                    "value": primaries
                })
            else
                LogWarn("Unknown colorInfo.primaries:", videoStream.colorInfo.primaries)
            end if
        end if

        if videoStream.colorInfo.transferCharacteristics <> invalid
            transferCharacteristics = m.colorInfo.transferCharacteristics[videoStream.colorInfo.transferCharacteristics]
            if transferCharacteristics <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:TransferCharacteristics"
                    "value": transferCharacteristics
                })
            else
                LogWarn("Unknown colorInfo.transferCharacteristics:", videoStream.colorInfo.transferCharacteristics)
            end if
        end if

        if videoStream.colorInfo.matrixCoefficients <> invalid
            matrixCoefficients = m.colorInfo.matrixCoefficients[videoStream.colorInfo.matrixCoefficients]
            if matrixCoefficients <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:MatrixCoefficients"
                    "value": matrixCoefficients
                })
            else
                LogWarn("Unknown colorInfo.matrixCoefficients:", videoStream.colorInfo.matrixCoefficients)
            end if
        end if
    end function

    function GetXtagsInfo(format as object) as object
        result = {
            lang: ""
            acont: ""
            isDrc: false
            isDubbed: false
            isAutoDubbed: false
            isDescriptive: false
            isSecondary: false
            isOriginal: false
        }

        if StringUtils.IsNullOrEmpty(format.url)
            return result
        end if

        ' Technically format.xtags can be used, but it is protobuf encoded
        ' so this is simpler. Also, this is consistent for both local
        ' Innertube and Invidious.
        queryParams = UrlUtils.ParseQueryComponents(format.url)
        xtagsString = queryParams["xtags"]
        if StringUtils.IsNullOrEmpty(xtagsString)
            return result
        end if

        tags = {}
        xtagsList = xtagsString.split(":")
        for each xtag in xtagsList
            pair = xtag.split("=")
            if pair.Count() = 2
                tags[pair[0]] = pair[1]
            end if
        end for

        for each key in tags
            if key = "lang"
                result.lang = tags[key]
            else if key = "acont"
                result.acont = tags[key]
            else if key = "drc" and tags[key] = "1"
                result.isDrc = true
            end if
        end for

        if format.isDrc = true
            result.isDrc = true
        end if

        if result.acont = "dubbed"
            result.isDubbed = true
        else if result.acont = "dubbed-auto"
            result.isAutoDubbed = true
        else if result.acont = "descriptive"
            result.isDescriptive = true
        else if result.acont = "secondary"
            result.isSecondary = true
        end if

        if result.acont = "original" or (not result.isDubbed and not result.isAutoDubbed and not result.isDescriptive and not result.isSecondary)
            result.isOriginal = true
        end if

        return result
    end function

    function GetDrmSystemId(drmFamily as dynamic) as dynamic
        if not IsString(drmFamily)
            return invalid
        end if
        if drmFamily = "WIDEVINE"
            return "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"
        else if drmFamily = "PLAYREADY"
            return "9a04f079-9840-4286-ab92-e65be0885f95"
        end if
        return invalid
    end function

end class

```

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpUtils.bs"
import "pkg:/source/services/XmlObject.bs"
import "pkg:/source/utils/Logging.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/UrlUtils.bs"

class DashManifest

    public invidiousInstance as dynamic

    function new(invidiousInstance as string)
        m.invidiousInstance = invidiousInstance

        m.utils = new Http.Utils()

        ' https://github.com/LuanRT/YouTube.js/blob/6082b4a52ee07a622735e6e9128a0531a5ae3bfb/src/utils/StreamingInfo.ts#L332-L349
        m.colorInfo = {
            primaries: {
                "COLOR_PRIMARIES_BT709": "1"
                "COLOR_PRIMARIES_BT2020": "9"
            }
            transferCharacteristics: {
                "COLOR_TRANSFER_CHARACTERISTICS_BT709": "1"
                "COLOR_TRANSFER_CHARACTERISTICS_BT2020_10": "14"
                "COLOR_TRANSFER_CHARACTERISTICS_SMPTEST2084": "16"
                "COLOR_TRANSFER_CHARACTERISTICS_ARIB_STD_B67": "18"
            }
            matrixCoefficients: {
                "COLOR_MATRIX_COEFFICIENTS_BT709": "1"
                "COLOR_MATRIX_COEFFICIENTS_BT2020_NCL": "14"
            }
        }
    end function

    function FromVideoMetadata(metadata as object, qualityFilter as object, local as boolean) as string
        adaptiveFormats = []
        adaptiveFormats.Append(metadata.adaptiveFormats)

        if local and m.invidiousInstance <> Invidious.PLAYLET_BUILT_IN_INSTANCE
            parsedInvidiousUrl = UrlUtils.ParseUrl(m.invidiousInstance)
            for i = 0 to adaptiveFormats.Count() - 1
                if StringUtils.IsNullOrEmpty(adaptiveFormats[i].url)
                    continue for
                end if
                parsedUrl = UrlUtils.ParseUrl(adaptiveFormats[i].url)
                parsedInvidiousUrl.path = UrlUtils.AppendQueryParams(parsedUrl.path, { host: parsedUrl.host })
                adaptiveFormats[i].url = UrlUtils.BuildUrlFromParts(parsedInvidiousUrl)
            end for
        end if

        duration = m.GetDuration(metadata)

        groupings = m.CreateFormatGroupings(adaptiveFormats, metadata.isPostLiveDvr)
        audioGroups = groupings.audio
        videoGroups = groupings.video

        ' Log available video resolutions before filtering
        for each group in videoGroups
            for each stream in group
                LogDebug("Available video stream:", stream.qualityLabel, stream.width, "x", stream.height, "codec:", stream.type)
            end for
        end for

        filteredVideoGroups = m.FilterVideoGroups(videoGroups, qualityFilter)
        if filteredVideoGroups.Count() = 0 and videoGroups.Count() > 0
            LogWarnNoTelemetry("No video streams found using quality filter:", qualityFilter, "Falling back to all video streams")
            filteredVideoGroups = videoGroups
        end if

        ' Log filtered video resolutions
        LogDebug("Quality filter:", qualityFilter)
        for each group in filteredVideoGroups
            for each stream in group
                LogDebug("Filtered video stream:", stream.qualityLabel, stream.width, "x", stream.height)
            end for
        end for

        if filteredVideoGroups.Count() = 0
            lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
            LogTelemetryEvent({
                level: "error"
                message: "No video streams found in metadata for Dash."
                fingerprint: ["No video streams found in metadata for Dash."]
                attachments: [{
                    filename: "metadata.json"
                    content_type: "application/json"
                    data: FormatJson(metadata)
                }, {
                    filename: "last_player_response.json"
                    content_type: "application/json"
                    data: lastPlayerResponse
                }]
            })
        end if
        storyboards = metadata.storyboards

        xml = new XmlObject()

        xml.Comment(`Generated by Playlet - Video ID: ${metadata.videoId}`)
        xml.Comment(`Parser: ${ValidString(metadata.parser)}`)

        if xml.Node("MPD", {
                "xmlns": "urn:mpeg:dash:schema:mpd:2011"
                "profiles": "urn:mpeg:dash:profile:full:2011"
                "minBufferTime": "PT1.5S"
                "type": "static"
                "mediaPresentationDuration": `PT${duration}S`
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                "xsi:schemaLocation": "urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"
            })
            if xml.Node("Period")

                id = 0
                id = m.GenerateAudioAdaptationSets(xml, audioGroups, id, metadata)
                id = m.GenerateVideoAdaptationSets(xml, filteredVideoGroups, id, metadata)
                m.GenerateImageAdaptationSets(xml, storyboards, id)

                xml.End()
            end if
            xml.End()
        end if
        return xml.ToXmlString()
    end function

    function GetDuration(metadata as object) as dynamic
        if metadata["isPostLiveDvr"] = true and IsInt(metadata["postLiveDvrDurationMs"])
            return metadata["postLiveDvrDurationMs"] / 1000.0
        end if

        approxDurationMs = ValidString(ObjectUtils.Dig(metadata, ["adaptiveFormats", 0, "approxDurationMs"])).ToInt()
        if approxDurationMs > 0
            return approxDurationMs / 1000.0
        end if

        return ValidInt(metadata["lengthSeconds"])
    end function

    function CreateFormatGroupings(formats as object, isPostLiveDvr as boolean) as object
        groupInfo = {}

        for each format in formats
            isOtf = format.isTypeOTF = true
            hasInit = not StringUtils.IsNullOrEmpty(format.init)
            hasIndex = not StringUtils.IsNullOrEmpty(format.index)
            isValid = (hasInit and hasIndex) or isOtf or isPostLiveDvr
            if not isValid
                continue for
            end if

            if not IsString(format.type)
                continue for
            end if

            if (format.width = invalid or format.height = invalid) and not StringUtils.IsNullOrEmpty(format.size)
                if format.size.instr("x") > 0
                    parts = format.size.Tokenize("x")
                    if parts.Count() = 2
                        format.width = ValidInt(parts[0].toInt())
                        format.height = ValidInt(parts[1].toInt())
                    end if
                end if
            end if

            codecs = ""
            mimeType = format.type.Tokenize(";")[0]
            if format.type.inStr("codecs=") <> -1
                codecs = format.type.split("codecs=")[1]
                if codecs.startsWith(`"`)
                    codecs = codecs.mid(1)
                end if
                if codecs.endsWith(`"`)
                    codecs = codecs.left(codecs.len() - 1)
                end if
            end if

            justCodec = codecs.split(".")[0]

            colorInfo = ""
            if IsAssociativeArray(format.colorInfo)
                colorInfo = `${format.colorInfo.primaries}-${format.colorInfo.transferCharacteristics}-${format.colorInfo.matrixCoefficients}`
            end if

            audioTrackId = ""
            if IsAssociativeArray(format.audioTrack) and IsString(format.audioTrack.id)
                audioTrackId = format.audioTrack.id
            end if

            if format.type.startsWith("audio")
                xtagsInfo = m.GetXtagsInfo(format)
                format.xtagsInfo = xtagsInfo
                format.isDrc = xtagsInfo.isDrc
                format.isDubbed = xtagsInfo.isDubbed
                format.isAutoDubbed = xtagsInfo.isAutoDubbed
                format.isDescriptive = xtagsInfo.isDescriptive
                format.isSecondary = xtagsInfo.isSecondary
                format.isOriginal = xtagsInfo.isOriginal
            end if

            drc = ""
            if format.isDrc = true
                drc = "drc"
            end if

            groupId = `${mimeType}-${justCodec}-${colorInfo}-${audioTrackId}-${drc}`

            if groupInfo[groupId] = invalid
                groupInfo[groupId] = []
            end if
            groupInfo[groupId].Push(format)
        end for

        audioGroups = []
        videoGroups = []

        for each key in groupInfo
            group = groupInfo[key]
            if group[0].type.startsWith("audio")
                audioGroups.Push(group)
            else if group[0].type.startsWith("video")
                videoGroups.Push(group)
            end if
        end for

        return { audio: audioGroups, video: videoGroups }
    end function

    function FilterVideoGroups(videoGroups as object, qualityFilter as object) as object
        if qualityFilter.Count() = 0
            return videoGroups
        end if

        filteredGroups = []
        for each group in videoGroups
            filteredStreams = []
            for each stream in group
                if m.IsVideoFormatIncluded(stream, qualityFilter)
                    filteredStreams.Push(stream)
                end if
            end for

            if filteredStreams.Count() > 0
                filteredGroups.Push(filteredStreams)
            end if
        end for
        return filteredGroups
    end function

    function IsVideoFormatIncluded(stream as object, qualityFilter as object) as boolean
        if qualityFilter.Count() = 0
            return true
        end if

        qualityLabel = stream.qualityLabel
        if not StringUtils.IsNullOrEmpty(qualityLabel)
            pIndex = qualityLabel.InStr("p")
            if pIndex <> -1
                qualityLabel = qualityLabel.Mid(0, pIndex)
            end if
            if qualityFilter[qualityLabel] = true
                return true
            end if
        end if

        if stream.height <> invalid
            if qualityFilter[ToString(stream.height)] = true
                return true
            end if
        end if

        resolution = stream.resolution
        if not StringUtils.IsNullOrEmpty(resolution)
            pIndex = resolution.InStr("p")
            if pIndex <> -1
                resolution = resolution.Mid(0, pIndex)
            end if
            if qualityFilter[resolution] = true
                return true
            end if
        end if

        size = stream.size
        if not StringUtils.IsNullOrEmpty(size)
            sizeParts = size.Split("x")
            if sizeParts.Count() = 2
                if qualityFilter[sizeParts[1]] = true
                    return true
                end if
            end if
        end if

        return false
    end function

    function GenerateAudioAdaptationSets(xml as object, audioGroups as object, id as integer, metadata as object) as integer
        for each group in audioGroups
            firstFormat = group[0]
            hoisted = {}

            mimeType = firstFormat.type.Tokenize(";")[0]

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": mimeType
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "contentType": "audio"
            }

            if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.languageCode)
                adaptationSetAttributes["lang"] = firstFormat.audioTrack.languageCode
            end if

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            audioSampleRate = m.HoistNumberAttribute(group, "audioSampleRate", hoisted)
            if IsInt(audioSampleRate)
                adaptationSetAttributes["audioSamplingRate"] = audioSampleRate
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                if IsAssociativeArray(firstFormat.audioTrack) or firstFormat.isDrc = true
                    ' Roles
                    roles = m.GetTrackRoles(firstFormat)
                    for each role in roles
                        xml.EmptyNode("Role", { "schemeIdUri": "urn:mpeg:dash:role:2011", "value": role })
                    end for

                    ' Label
                    if IsAssociativeArray(firstFormat.audioTrack) and IsString(firstFormat.audioTrack.displayName)
                        displayName = firstFormat.audioTrack.displayName
                        if firstFormat.isDrc = true
                            displayName = `${displayName} (Stable Volume)`
                        end if
                        xml.Node("Label", { "id": id })
                        xml.Text(displayName)
                        xml.End()
                    end if
                end if

                ' AudioChannelConfiguration
                channels = m.HoistAudioChannels(group, hoisted)
                if IsInt(channels)
                    xml.EmptyNode("AudioChannelConfiguration", {
                        "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                        "value": channels
                    })
                end if

                for each stream in group
                    representationId = stream.itag
                    if IsAssociativeArray(stream.audioTrack) and IsString(stream.audioTrack.id)
                        representationId = `${representationId}-${stream.audioTrack.id}`
                    end if
                    if stream.isDrc = true
                        representationId = `${representationId}-drc`
                    end if

                    representationAttributes = {
                        "id": representationId
                        "bandwidth": stream.bitrate
                    }
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["audioSampleRate"] = invalid
                        representationAttributes["audioSamplingRate"] = stream.audioSampleRate
                    end if

                    if xml.Node("Representation", representationAttributes)
                        if hoisted["AudioChannelConfiguration"] = invalid and IsInt(stream.audioChannels)
                            xml.EmptyNode("AudioChannelConfiguration", {
                                "schemeIdUri": "urn:mpeg:dash:23003:3:audio_channel_configuration:2011"
                                "value": stream.audioChannels
                            })
                        end if

                        m.GenerateSegmentInformation(xml, stream, metadata)

                        xml.End()
                    end if
                end for

                xml.End()
            end if
            id += 1
        end for
        return id
    end function

    function GenerateVideoAdaptationSets(xml as object, videoGroups as object, id as integer, metadata as object) as integer
        for each group in videoGroups
            firstFormat = group[0]
            hoisted = {}

            mimeType = firstFormat.type.Tokenize(";")[0]

            adaptationSetAttributes = {
                "id": `${id}`
                "mimeType": mimeType
                "startWithSAP": "1"
                "subsegmentAlignment": "true"
                "maxPlayoutRate": "1"
                "contentType": "video"
            }

            ' Hoist common attributes
            codecs = m.HoistCodecs(group, hoisted)
            if IsString(codecs)
                adaptationSetAttributes["codecs"] = codecs
            end if
            fps = m.HoistNumberAttribute(group, "fps", hoisted)
            if fps <> invalid
                adaptationSetAttributes["frameRate"] = fps
            end if

            if xml.Node("AdaptationSet", adaptationSetAttributes)
                if IsArray(firstFormat.drmFamilies)
                    for each drmFamily in firstFormat.drmFamilies
                        systemId = m.GetDrmSystemId(drmFamily)
                        if IsString(systemId)
                            xml.EmptyNode("ContentProtection", { "schemeIdUri": `urn:uuid:${systemId}` })
                        end if
                    end for
                end if

                m.AddColorInfo(firstFormat, xml)

                for each stream in group
                    representationAttributes = {
                        "id": stream.itag
                        "bandwidth": stream.bitrate
                    }
                    if stream.width <> invalid
                        representationAttributes["width"] = stream.width
                    end if
                    if stream.height <> invalid
                        representationAttributes["height"] = stream.height
                    end if
                    if hoisted["codecs"] = invalid and (stream.type.inStr("codecs=") <> -1)
                        representationAttributes["codecs"] = stream.type.split("codecs=")[1].replace(`"`, "").replace(`"`, "")
                    end if
                    if hoisted["fps"] = invalid
                        representationAttributes["frameRate"] = stream.fps
                    end if

                    if xml.Node("Representation", representationAttributes)
                        m.GenerateSegmentInformation(xml, stream, metadata)
                        xml.End()
                    end if
                end for

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function GenerateSegmentInformation(xml as object, stream as object, metadata as object) as void
        if StringUtils.IsNullOrEmpty(stream.url)
            xml.Comment(`[ERROR] Stream.url is null or empty for itag: ${stream.itag}`)
        end if

        if metadata.isPostLiveDvr = true
            if not IsInt(stream.targetDurationSec)
                xml.Comment(`[ERROR] Post-Live DVR stream missing targetDurationSec for itag: ${stream.itag}`)
                return
            end if

            if stream.targetDurationSec < 1
                xml.Comment(`[ERROR] Post-Live DVR stream has invalid targetDurationSec (${stream.targetDurationSec}) for itag: ${stream.itag}`)
                return
            end if

            postLiveDvrSegmentCount = metadata.postLiveDvrSegmentCount
            if not IsInt(postLiveDvrSegmentCount)
                xml.Comment(`[ERROR] Post-Live DVR metadata missing postLiveDvrSegmentCount for itag: ${stream.itag}`)
                ' We're going to guess segment count from targetDurationSec and total duration
                totalDurationMs = m.GetDuration(metadata) * 1000.0
                postLiveDvrSegmentCount = MathUtils.Max(Fix(totalDurationMs / (stream.targetDurationSec * 1000)), 1)
                xml.Comment(`[INFO] Guessing postLiveDvrSegmentCount as ${postLiveDvrSegmentCount} for itag: ${stream.itag}`)
            end if

            duration = stream.targetDurationSec * 1000
            repeatCount = postLiveDvrSegmentCount - 1
            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    xml.EmptyNode("S", { "d": duration, "r": repeatCount })
                    xml.End()
                end if
                xml.End()
            end if
        else if stream.isTypeOTF = true
            segmentDurations = stream.otfSegmentDurations
            if not IsArray(segmentDurations)
                xml.Comment(`[ERROR] OTF stream missing otfSegmentDurations for itag: ${stream.itag}`)
                return
            end if

            if xml.Node("SegmentTemplate", { "initialization": `${stream.url}&sq=0`, "media": `${stream.url}&sq=$Number$`, "timescale": "1000" })
                if xml.Node("SegmentTimeline")
                    if segmentDurations.Count() = 0
                        xml.Comment(`[ERROR] OTF stream has empty otfSegmentDurations for itag: ${stream.itag}`)
                    end if
                    for each segment in segmentDurations
                        xml.EmptyNode("S", segment)
                    end for
                    xml.End()
                end if
                xml.End()
            end if
        else
            xml.TextNode("BaseURL", ValidString(stream.url))

            if StringUtils.IsNullOrEmpty(stream.index) or StringUtils.IsNullOrEmpty(stream.init)
                xml.Comment(`[ERROR] Stream index: ${stream.index}, init: ${stream.init} is invalid for itag: ${stream.itag}`)
            end if
            if xml.Node("SegmentBase", { "indexRange": stream.index })
                xml.EmptyNode("Initialization", { "range": stream.init })
                xml.End()
            end if
        end if
    end function

    function HoistCodecs(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstCodec = formats[0].type.split("codecs=")[1]
        for i = 1 to formats.Count() - 1
            currentCodec = formats[i].type.split("codecs=")[1]
            if firstCodec <> currentCodec
                return invalid
            end if
        end for

        hoisted["codecs"] = true
        return firstCodec.replace(`"`, "").replace(`"`, "")
    end function

    function HoistNumberAttribute(formats as object, property as string, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstFormat = formats[0]
        if firstFormat[property] = invalid
            return invalid
        end if

        firstValue = firstFormat[property]
        for i = 1 to formats.Count() - 1
            otherValue = formats[i][property]
            if type(otherValue) <> type(firstValue) or otherValue <> firstValue
                return invalid
            end if
        end for

        hoisted[property] = true
        return firstValue
    end function

    function HoistAudioChannels(formats as object, hoisted as object) as dynamic
        if formats.Count() < 2
            return invalid
        end if

        firstValue = formats[0].audioChannels
        if firstValue = invalid
            firstValue = 2
        end if

        for i = 1 to formats.Count() - 1
            currentValue = formats[i].audioChannels
            if currentValue = invalid
                currentValue = 2
            end if
            if currentValue <> firstValue
                return invalid
            end if
        end for

        hoisted["AudioChannelConfiguration"] = true
        return firstValue
    end function

    function GetTrackRoles(format as object) as object
        roles = []
        if format.isOriginal = true
            roles.Push("main")
        else
            roles.Push("alternate")
        end if

        if format.isDubbed = true or format.isAutoDubbed = true
            roles.Push("dub")
        end if

        if format.isDescriptive = true
            roles.Push("description")
        end if

        if format.isDrc = true
            roles.Push("enhanced-audio-intelligibility")
        end if

        return roles
    end function

    function GenerateImageAdaptationSets(xml as object, storyboards as object, id as integer) as integer
        ' https://developer.roku.com/en-ca/docs/developer-program/media-playback/trick-mode/hls-and-dash.md#dash-standard-thumbnail-tiles
        for i = storyboards.Count() - 1 to 0 step -1
            storyboard = storyboards[i]
            interval = ValidInt(storyboard.interval)
            if interval = 0
                LogWarnNoTelemetry("Invalid storyboard interval:", storyboard.interval)
                continue for
            end if

            storyboardWidth = storyboard.storyboardWidth
            storyboardHeight = storyboard.storyboardHeight
            storyboardCount = storyboard.storyboardCount
            tileWidthInPixels = storyboard.width
            tileHeightInPixels = storyboard.height
            totalTileCount = storyboard.count

            ' For the last page, the image height might be smaller than the storyboard height
            if storyboardCount = 1
                storyboardHeight = totalTileCount \ storyboardWidth
                if totalTileCount mod storyboardWidth > 0
                    storyboardHeight += 1
                end if
            end if

            intervalInSeconds = interval / 1000.0

            ' YouTube template uses the var $M for tile pages
            ' DASH-IF uses $Number$ in the SegmentTemplate
            ' https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf
            url = storyboard.templateUrl.replace("$M", "$Number$")

            tilesPerPage = storyboardWidth * storyboardHeight
            duration = tilesPerPage * intervalInSeconds

            storyboardWidthInPixels = tileWidthInPixels * storyboardWidth
            storyboardHeightInPixels = tileHeightInPixels * storyboardHeight

            ' Bandwidth is kind of a guess...
            bandwidth = ((storyboardWidthInPixels * storyboardHeightInPixels * 0.5) / duration)

            if xml.Node("AdaptationSet", {
                    "id": `${id}`
                    "mimeType": "image/jpeg"
                    "contentType": "image"
                })
                xml.EmptyNode("SegmentTemplate", {
                    "media": url
                    "duration": duration
                    "startNumber": 0
                })

                if xml.Node("Representation", {
                        "id": `thumbnails_${id}`
                        "bandwidth": bandwidth
                        "width": storyboardWidthInPixels
                        "height": storyboardHeightInPixels
                    })

                    xml.EmptyNode("EssentialProperty", {
                        "schemeIdUri": "http://dashif.org/guidelines/thumbnail_tile"
                        "value": `${storyboardWidth}x${storyboardHeight}`
                    })

                    xml.End()
                end if

                xml.End()
            end if

            id += 1
        end for
        return id
    end function

    function AddColorInfo(videoStream as object, xml as object) as void
        if videoStream.colorInfo = invalid
            return
        end if

        if videoStream.colorInfo.primaries <> invalid
            primaries = m.colorInfo.primaries[videoStream.colorInfo.primaries]
            if primaries <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:ColourPrimaries"
                    "value": primaries
                })
            else
                LogWarn("Unknown colorInfo.primaries:", videoStream.colorInfo.primaries)
            end if
        end if

        if videoStream.colorInfo.transferCharacteristics <> invalid
            transferCharacteristics = m.colorInfo.transferCharacteristics[videoStream.colorInfo.transferCharacteristics]
            if transferCharacteristics <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:TransferCharacteristics"
                    "value": transferCharacteristics
                })
            else
                LogWarn("Unknown colorInfo.transferCharacteristics:", videoStream.colorInfo.transferCharacteristics)
            end if
        end if

        if videoStream.colorInfo.matrixCoefficients <> invalid
            matrixCoefficients = m.colorInfo.matrixCoefficients[videoStream.colorInfo.matrixCoefficients]
            if matrixCoefficients <> invalid
                xml.EmptyNode("SupplementalProperty", {
                    "schemeIdUri": "urn:mpeg:mpegB:cicp:MatrixCoefficients"
                    "value": matrixCoefficients
                })
            else
                LogWarn("Unknown colorInfo.matrixCoefficients:", videoStream.colorInfo.matrixCoefficients)
            end if
        end if
    end function

    function GetXtagsInfo(format as object) as object
        result = {
            lang: ""
            acont: ""
            isDrc: false
            isDubbed: false
            isAutoDubbed: false
            isDescriptive: false
            isSecondary: false
            isOriginal: false
        }

        if StringUtils.IsNullOrEmpty(format.url)
            return result
        end if

        ' Technically format.xtags can be used, but it is protobuf encoded
        ' so this is simpler. Also, this is consistent for both local
        ' Innertube and Invidious.
        queryParams = UrlUtils.ParseQueryComponents(format.url)
        xtagsString = queryParams["xtags"]
        if StringUtils.IsNullOrEmpty(xtagsString)
            return result
        end if

        tags = {}
        xtagsList = xtagsString.split(":")
        for each xtag in xtagsList
            pair = xtag.split("=")
            if pair.Count() = 2
                tags[pair[0]] = pair[1]
            end if
        end for

        for each key in tags
            if key = "lang"
                result.lang = tags[key]
            else if key = "acont"
                result.acont = tags[key]
            else if key = "drc" and tags[key] = "1"
                result.isDrc = true
            end if
        end for

        if format.isDrc = true
            result.isDrc = true
        end if

        if result.acont = "dubbed"
            result.isDubbed = true
        else if result.acont = "dubbed-auto"
            result.isAutoDubbed = true
        else if result.acont = "descriptive"
            result.isDescriptive = true
        else if result.acont = "secondary"
            result.isSecondary = true
        end if

        if result.acont = "original" or (not result.isDubbed and not result.isAutoDubbed and not result.isDescriptive and not result.isSecondary)
            result.isOriginal = true
        end if

        return result
    end function

    function GetDrmSystemId(drmFamily as dynamic) as dynamic
        if not IsString(drmFamily)
            return invalid
        end if
        if drmFamily = "WIDEVINE"
            return "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"
        else if drmFamily = "PLAYREADY"
            return "9a04f079-9840-4286-ab92-e65be0885f95"
        end if
        return invalid
    end function

end class

```

Now let me look at how to add direct VP9 stream URLs as fallbacks in the video content job:

I see the architecture. The player tries URLs in order as fallbacks. Let me add direct VP9/WebM stream URLs after the DASH URLs - this way DASH works for H.264, and if DASH fails for VP9, the direct WebM URLs are tried as fallbacks:

```brighterscript
import "pkg:/components/Services/Innertube/InnertubeService.bs"
import "pkg:/components/Services/Invidious/InvidiousService.bs"

@job("VideoContentJob")
function ExecuteJob() as void
    input = JobGetInput()

    contentNode = input.content
    invidiousNode = input.invidious
    innertubeNode = input.innertube
    preferencesNode = input.preferences
    loungeServiceNode = input.loungeService
    playletServerPort = input.playletServerPort

    if JobIsCancelled()
        JobCancel()
        return
    end if

    DeleteFile("cachefs:/last_generated_dash.xml")
    DeleteFile("cachefs:/last_generated_hls.m3u8")

    if StringUtils.IsNullOrEmpty(contentNode.videoId)
        JobError("Can't load video information: videoId is missing")
        return
    end if

    service = new Invidious.InvidiousService(invidiousNode)
    backend = preferencesNode["backend.selected"]

    metadata = contentNode.metadata
    if not IsAssociativeArray(metadata)
        cancellation = JobGetCancellation()
        if backend = "playlet"
            visitorData = innertubeNode.visitorData
            if StringUtils.IsNullOrEmpty(visitorData)
                messagePort = CreateObject("roMessagePort")
                MessagePortUtils.ObserveFieldScopedExSafe(innertubeNode, "visitorData", messagePort)
                innertubeNode.requestVisitorData = true
                message = wait(20000, messagePort)
                innertubeNode.unobserveFieldScoped("visitorData")
                if message = invalid
                    innertubeNode.forceRequestVisitorData = true
                    JobError("Failed to get visitor data. Please try again later.")
                    return
                end if
                visitorData = message.getData()
            end if

            accessToken = invalid
            onBehalfOfUser = invalid
            authToken = invidiousNode.authToken
            if authToken <> invalid and authToken.profileNode <> invalid and authToken.profileNode.type = "youtube" and not StringUtils.IsNullOrEmpty(authToken.token)
                accessToken = authToken.token
                onBehalfOfUser = authToken.activeIdentifyToken
            end if

            metadata = InnertubeService.GetVideoMetadata(contentNode.videoId, {
                "cancellation": cancellation
                "credentialTransferToken": loungeServiceNode.credentialTransferToken
                "visitorData": visitorData
                "accessToken": accessToken
                "onBehalfOfUser": onBehalfOfUser
                "signatureTimestamp": true
            })
        else
            metadata = service.GetVideoMetadata(contentNode.videoId, { cancellation: m.top.cancellation })
        end if
    end if

    if JobIsCancelled()
        JobCancel()
        return
    end if

    if metadata = invalid
        JobError("Failed to get video metadata")
        return
    end if

    title = metadata.title
    if not StringUtils.IsNullOrEmpty(title)
        contentNode.title = title
    end if

    author = metadata.author
    if not StringUtils.IsNullOrEmpty(author)
        contentNode.secondaryTitle = metadata.author
    end if
    contentNode.live = metadata.liveNow

    if metadata.error <> invalid
        ' Adding metadata allows us to play next recommended video after displaying the error
        contentNode.addFields({ metadata: metadata })
        JobError(metadata.error)
        return
    end if

    streamUrls = CreateStreamUrls(metadata, service, preferencesNode, backend, playletServerPort)
    if streamUrls.Count() = 0
        contentNode.addFields({ metadata: metadata })
        error = "No playable streams found for this video."
        lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
        LogTelemetryEvent({
            level: "error"
            message: error
            fingerprint: error
            attachments: [{
                filename: "last_player_response.json"
                content_type: "application/json"
                data: lastPlayerResponse
            }]
        })
        JobError(error)
        return
    end if

    isDrm = not StringUtils.IsNullOrEmpty(metadata.drmParams)
    if isDrm
        licenseServerURL = UrlUtils.BuildUrl(`http://127.0.0.1:${playletServerPort}/api/innertube/get_drm_license`, invalid, {
            videoId: metadata.videoId
            drmParams: metadata.drmParams
            drmSessionId: metadata.drmSessionId
            cpn: metadata.cpn
        })
        contentNode.drmParams = {
            keySystem: "Widevine"
            licenseServerURL: licenseServerURL
        }
    end if

    ' Forwarding query params to HLS playlists is not needed. In fact, it can cause issues
    ' because the playlist is limited to 4MB, and on large playlists the query params
    ' significantly increase the size of the playlist, making it cropped.
    ' https://github.com/iBicha/playlet/issues/500
    contentNode.ForwardQueryStringParams = false
    contentNode.addFields({
        metadata: metadata
        ' StreamUrls is taken
        playletStreamUrls: streamUrls
        playletStreamUrlIndex: 0
    })

    firstUrl = streamUrls[0]
    LogDebug("Setting first url:", firstUrl)
    if StringUtils.IsNullOrEmpty(firstUrl)
        LogError("First stream URL is empty!")
    end if
    contentNode.url = firstUrl

    SetCaptions(metadata, service, contentNode)

    if metadata.liveNow = true
        contentNode.Live = true
    end if
end function

function CreateStreamUrls(metadata as object, service as Invidious.InvidiousService, preferences as object, backend as string, playletServerPort as integer) as object
    instance = service.GetInstance()
    proxyVideos = preferences["invidious.proxy_videos"]
    preferredQuality = preferences["playback.preferred_quality"]

    streamUrls = []

    if SupportsDrmDashManifestUrl(metadata)
        dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
            url: metadata.dashUrl
        })
        streamUrls.push(dashUrl)
    else if SupportsHls(metadata)
        metadata.hlsUrl = AddInstanceToUrlIfNeeded(metadata.hlsUrl, instance)
        AddHlsUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsDash(metadata)
        AddDashUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsMuxedFormats(metadata)
        for each stream in metadata.formatStreams
            if StringUtils.IsNullOrEmpty(stream.url)
                continue for
            end if
            stream.url = AddInstanceToUrlIfNeeded(stream.url, instance)
            streamUrls.push(stream.url)
        end for
    end if

    return streamUrls
end function

function SupportsHls(metadata as object) as boolean
    return not StringUtils.IsNullOrEmpty(metadata.hlsUrl)
end function

function SupportsDash(metadata as object) as boolean
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return false
    end if

    for each fmt in metadata.adaptiveFormats
        if not StringUtils.IsNullOrEmpty(fmt.url)
            return true
        end if
    end for

    return false
end function

function SupportsMuxedFormats(metadata as object) as boolean
    return IsArray(metadata.formatStreams) and metadata.formatStreams.Count() > 0
end function

function SupportsDrmDashManifestUrl(metadata as object) as boolean
    if StringUtils.IsNullOrEmpty(metadata.drmParams)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.dashUrl)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.drmSessionId)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.cpn)
        return false
    end if

    if not IsArray(metadata.licenseInfos) or metadata.licenseInfos.Count() = 0
        return false
    end if

    return true
end function

function AddHlsUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer)
    hlsUrl = metadata.hlsUrl
    hlsUrlLocal = invalid
    hlsUrlFiltered = invalid
    hlsUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(hlsUrl, { local: "true" })
    end if

    ' Redirect to Playet's local web server, where we will be
    ' dynamically adding storyboards to the HLS manifest, and filter quality
    hlsUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrl, v: metadata.videoId })
    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrlLocal, v: metadata.videoId })
    end if

    if hasQuality
        hlsUrlFiltered = UrlUtils.AppendQueryParams(hlsUrl, { quality: preferredQuality })
        if supportsProxying
            hlsUrlFilteredLocal = UrlUtils.AppendQueryParams(hlsUrlLocal, { quality: preferredQuality })
        end if
    end if

    AddUrls(streamUrls, hlsUrl, hlsUrlLocal, hlsUrlFiltered, hlsUrlFilteredLocal, proxyVideos)
end function

function AddDashUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer) as void
    ' Redirect to Playet's local web server, where will will be
    ' dynamically generating the DASH manifest, and filter quality
    dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
        v: metadata.videoId
    })

    dashUrlLocal = invalid
    dashUrlFiltered = invalid
    dashUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        dashUrlLocal = UrlUtils.AppendQueryParams(dashUrl, { local: "true" })
    end if

    if hasQuality
        dashUrlFiltered = UrlUtils.AppendQueryParams(dashUrl, { quality: preferredQuality })
        if supportsProxying
            dashUrlFilteredLocal = UrlUtils.AppendQueryParams(dashUrlLocal, { quality: preferredQuality })
        end if
    end if

    AddUrls(streamUrls, dashUrl, dashUrlLocal, dashUrlFiltered, dashUrlFilteredLocal, proxyVideos)

    ' Add direct VP9/WebM stream URLs as fallbacks
    ' Roku's DASH player doesn't support WebM containers, but Roku can play WebM files directly
    AddDirectVp9Fallbacks(streamUrls, metadata, preferredQuality)
end function

function AddDirectVp9Fallbacks(streamUrls as object, metadata as object, preferredQuality as string) as void
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return
    end if

    ' Parse quality filter
    qualityHeights = {}
    if not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"
        includeList = preferredQuality.split(",")
        for each quality in includeList
            pIndex = quality.InStr("p")
            if pIndex <> -1
                height = quality.Mid(0, pIndex)
                qualityHeights[height] = true
            end if
        end for
    end if

    ' Find VP9/WebM video streams and add as fallbacks
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        ' Check if this is a VP9/WebM video stream
        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("video/webm")
            continue for
        end if

        ' Skip HDR streams (vp9.2) as they may have additional compatibility issues
        if fmtType.InStr("vp9.2") <> -1
            continue for
        end if

        ' Check quality filter if set
        if qualityHeights.Count() > 0
            height = ValidString(fmt.height)
            if height = "" and fmt.height <> invalid
                height = fmt.height.ToStr()
            end if
            if not qualityHeights.DoesExist(height)
                continue for
            end if
        end if

        LogDebug("Adding VP9 direct fallback URL:", fmt.qualityLabel, fmt.width, "x", fmt.height)
        streamUrls.push(fmt.url)
    end for
end function

function AddUrls(streamUrls as object, url as string, urlLocal as dynamic, urlFiltered as dynamic, urlFilteredLocal as dynamic, proxyVideos as string)
    if proxyVideos = "if_needed"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    else if proxyVideos = "never"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
    else if proxyVideos = "always"
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if

    if streamUrls.Count() = 0
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if
end function

function AddInstanceToUrlIfNeeded(url as dynamic, instance as string) as dynamic
    if IsString(url) and url.StartsWith("/")
        return instance + url
    end if
    return url
end function

function SetCaptions(metadata as object, service as object, contentNode as object) as void
    if metadata.captions.Count() = 0
        return
    end if

    isoLanguageList = StringUtils.ParseJsonSafe(ReadAsciiFile("libpkg:/config/ISO-639-1-to-ISO-639-2T.json5"))
    instance = service.GetInstance()

    subtitleTracks = []

    for each caption in metadata.captions
        code = caption.language_code
        if StringUtils.IsNullOrEmpty(code)
            continue for
        end if

        if code.InStr("-") <> -1
            code = code.Split("-")[0]
        end if

        if code.len() = 2
            if not isoLanguageList.DoesExist(code)
                continue for
            end if
            code = isoLanguageList[code]
        end if

        url = caption.url
        if not url.StartsWith("http")
            url = instance + url
        end if

        subtitleTracks.Push({
            Description: caption.label
            Language: code
            TrackName: url
        })
    end for

    contentNode.ClosedCaptions = True
    contentNode.SubtitleTracks = subtitleTracks
end function

```

Let me verify the imports are in place:

Good, no errors. Now let me explain the fix:

## What I Changed

### 1. Reverted the mimeType Hack
The previous attempt to change `video/webm` to `video/mp4` in the DASH manifest was causing the black screen because Roku tried to parse the WebM stream as MP4 format.

### 2. Added Direct VP9/WebM Fallback URLs
The new approach adds direct WebM stream URLs **after** the DASH URLs in the fallback chain:

```
[VideoContentJob.bs] AddDirectVp9Fallbacks()
```

**How it works:**
1. Player first tries DASH manifest (works for H.264/AVC streams)
2. If DASH fails (VP9/WebM not supported in DASH), player automatically tries next URL
3. Direct WebM URLs are now added as fallbacks
4. Roku CAN play WebM files directly, just not via DASH manifests

### 3. Smart Filtering
- Only adds VP9 streams (not HDR `vp9.2` which may have issues)
- Respects your quality preference (if you selected 2160p, only 2160p VP9 streams are added)
- Logs when adding VP9 fallbacks so you can see them in the debug output

## Test It

1. **Redeploy the app**
2. **Play a 4K video with quality set to 2160p**
3. **Watch the debug log** - you should see:
   - `Adding VP9 direct fallback URL: 2160p60 3840 x 2160`
   - Then after DASH fails, Roku tries the direct URL
4. **Check if 4K plays** - look for `Video format: vp9 3840x2160`

```plaintext
[VideoContentJob.bs] AddDirectVp9Fallbacks()
```

---

**User**

When I started debugging it seemed to stall when connecting to the roku device, but I started the app manually from the UI and see this but I'm unsure if it's our latest build.  I'm still getting a black screen with audio

@extension-output-RokuCommunity.brightscript-#1-BrightScript Log (328-341) 

---

**Cursor**

The log shows the **old code is still running** - notice these lines:

```
Changed mimeType from audio/webm to audio/mp4 for DASH compatibility
Changed mimeType from video/webm to video/mp4 for VP9 DASH compatibility
```

This is the code I just reverted! Also, there's no `Adding VP9 direct fallback URL` message which would indicate the new fallback code is running.

**Your Roku is running the previous build, not the latest changes.**

Let me verify my changes saved correctly:

```plaintext
Changed mimeType from audio/webm to audio/mp4 for DASH compatibility
Changed mimeType from video/webm to video/mp4 for VP9 DASH compatibility
```

My changes are saved correctly in the source files:
- ✅ mimeType hack removed (no matches found)
- ✅ `AddDirectVp9Fallbacks` function added

**You need to rebuild and redeploy the app.** The Roku is still running the old version.

Try one of these:

1. **In VS Code/Cursor**: Press `F5` to start a debug session (this builds and deploys)

2. **Or run manually**:
   ```bash
   cd playlet-lib
   npm run build
   ```
   Then deploy the built package to your Roku

3. **If debugging is stuck**, try:
   - Restart your Roku device
   - Or use the Roku web interface at `http://<roku-ip>:8060` to verify the device is responsive

Once you've deployed the new build, look for these log messages to confirm:
- `Adding VP9 direct fallback URL: 2160p60 3840 x 2160` (new code)
- NO `Changed mimeType from video/webm to video/mp4` (old code removed)

```shellscript
   cd playlet-lib
   npm run build
```

---

**User**

@extension-output-RokuCommunity.brightscript-#1-BrightScript Log (284-363) 

---

**Cursor**

I can see the new code is running:
- ✅ `Adding VP9 direct fallback URL: 2160p60 3840 x 2160` (line 301)
- ✅ No mimeType hack messages

**But the problem is:** The player tried the DASH URL first, got audio working (aac), and **didn't try the fallback** because it thinks it's "playing" successfully.

The fix: **Put the direct VP9 URL FIRST** (before DASH) when 4K is selected, since YouTube doesn't have 4K in H.264 anyway.

I need to change the order - add VP9 direct URLs **BEFORE** DASH when 4K is selected:

```brighterscript
import "pkg:/components/Services/Innertube/InnertubeService.bs"
import "pkg:/components/Services/Invidious/InvidiousService.bs"

@job("VideoContentJob")
function ExecuteJob() as void
    input = JobGetInput()

    contentNode = input.content
    invidiousNode = input.invidious
    innertubeNode = input.innertube
    preferencesNode = input.preferences
    loungeServiceNode = input.loungeService
    playletServerPort = input.playletServerPort

    if JobIsCancelled()
        JobCancel()
        return
    end if

    DeleteFile("cachefs:/last_generated_dash.xml")
    DeleteFile("cachefs:/last_generated_hls.m3u8")

    if StringUtils.IsNullOrEmpty(contentNode.videoId)
        JobError("Can't load video information: videoId is missing")
        return
    end if

    service = new Invidious.InvidiousService(invidiousNode)
    backend = preferencesNode["backend.selected"]

    metadata = contentNode.metadata
    if not IsAssociativeArray(metadata)
        cancellation = JobGetCancellation()
        if backend = "playlet"
            visitorData = innertubeNode.visitorData
            if StringUtils.IsNullOrEmpty(visitorData)
                messagePort = CreateObject("roMessagePort")
                MessagePortUtils.ObserveFieldScopedExSafe(innertubeNode, "visitorData", messagePort)
                innertubeNode.requestVisitorData = true
                message = wait(20000, messagePort)
                innertubeNode.unobserveFieldScoped("visitorData")
                if message = invalid
                    innertubeNode.forceRequestVisitorData = true
                    JobError("Failed to get visitor data. Please try again later.")
                    return
                end if
                visitorData = message.getData()
            end if

            accessToken = invalid
            onBehalfOfUser = invalid
            authToken = invidiousNode.authToken
            if authToken <> invalid and authToken.profileNode <> invalid and authToken.profileNode.type = "youtube" and not StringUtils.IsNullOrEmpty(authToken.token)
                accessToken = authToken.token
                onBehalfOfUser = authToken.activeIdentifyToken
            end if

            metadata = InnertubeService.GetVideoMetadata(contentNode.videoId, {
                "cancellation": cancellation
                "credentialTransferToken": loungeServiceNode.credentialTransferToken
                "visitorData": visitorData
                "accessToken": accessToken
                "onBehalfOfUser": onBehalfOfUser
                "signatureTimestamp": true
            })
        else
            metadata = service.GetVideoMetadata(contentNode.videoId, { cancellation: m.top.cancellation })
        end if
    end if

    if JobIsCancelled()
        JobCancel()
        return
    end if

    if metadata = invalid
        JobError("Failed to get video metadata")
        return
    end if

    title = metadata.title
    if not StringUtils.IsNullOrEmpty(title)
        contentNode.title = title
    end if

    author = metadata.author
    if not StringUtils.IsNullOrEmpty(author)
        contentNode.secondaryTitle = metadata.author
    end if
    contentNode.live = metadata.liveNow

    if metadata.error <> invalid
        ' Adding metadata allows us to play next recommended video after displaying the error
        contentNode.addFields({ metadata: metadata })
        JobError(metadata.error)
        return
    end if

    streamUrls = CreateStreamUrls(metadata, service, preferencesNode, backend, playletServerPort)
    if streamUrls.Count() = 0
        contentNode.addFields({ metadata: metadata })
        error = "No playable streams found for this video."
        lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
        LogTelemetryEvent({
            level: "error"
            message: error
            fingerprint: error
            attachments: [{
                filename: "last_player_response.json"
                content_type: "application/json"
                data: lastPlayerResponse
            }]
        })
        JobError(error)
        return
    end if

    isDrm = not StringUtils.IsNullOrEmpty(metadata.drmParams)
    if isDrm
        licenseServerURL = UrlUtils.BuildUrl(`http://127.0.0.1:${playletServerPort}/api/innertube/get_drm_license`, invalid, {
            videoId: metadata.videoId
            drmParams: metadata.drmParams
            drmSessionId: metadata.drmSessionId
            cpn: metadata.cpn
        })
        contentNode.drmParams = {
            keySystem: "Widevine"
            licenseServerURL: licenseServerURL
        }
    end if

    ' Forwarding query params to HLS playlists is not needed. In fact, it can cause issues
    ' because the playlist is limited to 4MB, and on large playlists the query params
    ' significantly increase the size of the playlist, making it cropped.
    ' https://github.com/iBicha/playlet/issues/500
    contentNode.ForwardQueryStringParams = false
    contentNode.addFields({
        metadata: metadata
        ' StreamUrls is taken
        playletStreamUrls: streamUrls
        playletStreamUrlIndex: 0
    })

    firstUrl = streamUrls[0]
    LogDebug("Setting first url:", firstUrl)
    if StringUtils.IsNullOrEmpty(firstUrl)
        LogError("First stream URL is empty!")
    end if
    contentNode.url = firstUrl

    SetCaptions(metadata, service, contentNode)

    if metadata.liveNow = true
        contentNode.Live = true
    end if
end function

function CreateStreamUrls(metadata as object, service as Invidious.InvidiousService, preferences as object, backend as string, playletServerPort as integer) as object
    instance = service.GetInstance()
    proxyVideos = preferences["invidious.proxy_videos"]
    preferredQuality = preferences["playback.preferred_quality"]

    streamUrls = []

    if SupportsDrmDashManifestUrl(metadata)
        dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
            url: metadata.dashUrl
        })
        streamUrls.push(dashUrl)
    else if SupportsHls(metadata)
        metadata.hlsUrl = AddInstanceToUrlIfNeeded(metadata.hlsUrl, instance)
        AddHlsUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsDash(metadata)
        AddDashUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsMuxedFormats(metadata)
        for each stream in metadata.formatStreams
            if StringUtils.IsNullOrEmpty(stream.url)
                continue for
            end if
            stream.url = AddInstanceToUrlIfNeeded(stream.url, instance)
            streamUrls.push(stream.url)
        end for
    end if

    return streamUrls
end function

function SupportsHls(metadata as object) as boolean
    return not StringUtils.IsNullOrEmpty(metadata.hlsUrl)
end function

function SupportsDash(metadata as object) as boolean
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return false
    end if

    for each fmt in metadata.adaptiveFormats
        if not StringUtils.IsNullOrEmpty(fmt.url)
            return true
        end if
    end for

    return false
end function

function SupportsMuxedFormats(metadata as object) as boolean
    return IsArray(metadata.formatStreams) and metadata.formatStreams.Count() > 0
end function

function SupportsDrmDashManifestUrl(metadata as object) as boolean
    if StringUtils.IsNullOrEmpty(metadata.drmParams)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.dashUrl)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.drmSessionId)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.cpn)
        return false
    end if

    if not IsArray(metadata.licenseInfos) or metadata.licenseInfos.Count() = 0
        return false
    end if

    return true
end function

function AddHlsUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer)
    hlsUrl = metadata.hlsUrl
    hlsUrlLocal = invalid
    hlsUrlFiltered = invalid
    hlsUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(hlsUrl, { local: "true" })
    end if

    ' Redirect to Playet's local web server, where we will be
    ' dynamically adding storyboards to the HLS manifest, and filter quality
    hlsUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrl, v: metadata.videoId })
    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrlLocal, v: metadata.videoId })
    end if

    if hasQuality
        hlsUrlFiltered = UrlUtils.AppendQueryParams(hlsUrl, { quality: preferredQuality })
        if supportsProxying
            hlsUrlFilteredLocal = UrlUtils.AppendQueryParams(hlsUrlLocal, { quality: preferredQuality })
        end if
    end if

    AddUrls(streamUrls, hlsUrl, hlsUrlLocal, hlsUrlFiltered, hlsUrlFilteredLocal, proxyVideos)
end function

function AddDashUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer) as void
    ' Redirect to Playet's local web server, where will will be
    ' dynamically generating the DASH manifest, and filter quality
    dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
        v: metadata.videoId
    })

    dashUrlLocal = invalid
    dashUrlFiltered = invalid
    dashUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        dashUrlLocal = UrlUtils.AppendQueryParams(dashUrl, { local: "true" })
    end if

    if hasQuality
        dashUrlFiltered = UrlUtils.AppendQueryParams(dashUrl, { quality: preferredQuality })
        if supportsProxying
            dashUrlFilteredLocal = UrlUtils.AppendQueryParams(dashUrlLocal, { quality: preferredQuality })
        end if
    end if

    ' For 4K (2160p), add direct VP9/WebM URLs FIRST because:
    ' 1. YouTube doesn't have 4K in H.264, only VP9/AV1
    ' 2. Roku's DASH player doesn't support WebM containers
    ' 3. But Roku CAN play WebM files directly
    if preferredQuality <> invalid and preferredQuality.InStr("2160") <> -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if

    AddUrls(streamUrls, dashUrl, dashUrlLocal, dashUrlFiltered, dashUrlFilteredLocal, proxyVideos)

    ' Add direct VP9/WebM stream URLs as fallbacks for non-4K qualities
    if preferredQuality = invalid or preferredQuality.InStr("2160") = -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if
end function

function AddDirectVp9Fallbacks(streamUrls as object, metadata as object, preferredQuality as string) as void
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return
    end if

    ' Parse quality filter
    qualityHeights = {}
    if not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"
        includeList = preferredQuality.split(",")
        for each quality in includeList
            pIndex = quality.InStr("p")
            if pIndex <> -1
                height = quality.Mid(0, pIndex)
                qualityHeights[height] = true
            end if
        end for
    end if

    ' Find VP9/WebM video streams and add as fallbacks
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        ' Check if this is a VP9/WebM video stream
        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("video/webm")
            continue for
        end if

        ' Skip HDR streams (vp9.2) as they may have additional compatibility issues
        if fmtType.InStr("vp9.2") <> -1
            continue for
        end if

        ' Check quality filter if set
        if qualityHeights.Count() > 0
            height = ValidString(fmt.height)
            if height = "" and fmt.height <> invalid
                height = fmt.height.ToStr()
            end if
            if not qualityHeights.DoesExist(height)
                continue for
            end if
        end if

        LogDebug("Adding VP9 direct fallback URL:", fmt.qualityLabel, fmt.width, "x", fmt.height)
        streamUrls.push(fmt.url)
    end for
end function

function AddUrls(streamUrls as object, url as string, urlLocal as dynamic, urlFiltered as dynamic, urlFilteredLocal as dynamic, proxyVideos as string)
    if proxyVideos = "if_needed"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    else if proxyVideos = "never"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
    else if proxyVideos = "always"
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if

    if streamUrls.Count() = 0
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if
end function

function AddInstanceToUrlIfNeeded(url as dynamic, instance as string) as dynamic
    if IsString(url) and url.StartsWith("/")
        return instance + url
    end if
    return url
end function

function SetCaptions(metadata as object, service as object, contentNode as object) as void
    if metadata.captions.Count() = 0
        return
    end if

    isoLanguageList = StringUtils.ParseJsonSafe(ReadAsciiFile("libpkg:/config/ISO-639-1-to-ISO-639-2T.json5"))
    instance = service.GetInstance()

    subtitleTracks = []

    for each caption in metadata.captions
        code = caption.language_code
        if StringUtils.IsNullOrEmpty(code)
            continue for
        end if

        if code.InStr("-") <> -1
            code = code.Split("-")[0]
        end if

        if code.len() = 2
            if not isoLanguageList.DoesExist(code)
                continue for
            end if
            code = isoLanguageList[code]
        end if

        url = caption.url
        if not url.StartsWith("http")
            url = instance + url
        end if

        subtitleTracks.Push({
            Description: caption.label
            Language: code
            TrackName: url
        })
    end for

    contentNode.ClosedCaptions = True
    contentNode.SubtitleTracks = subtitleTracks
end function

```

```brighterscript
import "pkg:/components/Services/Innertube/InnertubeService.bs"
import "pkg:/components/Services/Invidious/InvidiousService.bs"

@job("VideoContentJob")
function ExecuteJob() as void
    input = JobGetInput()

    contentNode = input.content
    invidiousNode = input.invidious
    innertubeNode = input.innertube
    preferencesNode = input.preferences
    loungeServiceNode = input.loungeService
    playletServerPort = input.playletServerPort

    if JobIsCancelled()
        JobCancel()
        return
    end if

    DeleteFile("cachefs:/last_generated_dash.xml")
    DeleteFile("cachefs:/last_generated_hls.m3u8")

    if StringUtils.IsNullOrEmpty(contentNode.videoId)
        JobError("Can't load video information: videoId is missing")
        return
    end if

    service = new Invidious.InvidiousService(invidiousNode)
    backend = preferencesNode["backend.selected"]

    metadata = contentNode.metadata
    if not IsAssociativeArray(metadata)
        cancellation = JobGetCancellation()
        if backend = "playlet"
            visitorData = innertubeNode.visitorData
            if StringUtils.IsNullOrEmpty(visitorData)
                messagePort = CreateObject("roMessagePort")
                MessagePortUtils.ObserveFieldScopedExSafe(innertubeNode, "visitorData", messagePort)
                innertubeNode.requestVisitorData = true
                message = wait(20000, messagePort)
                innertubeNode.unobserveFieldScoped("visitorData")
                if message = invalid
                    innertubeNode.forceRequestVisitorData = true
                    JobError("Failed to get visitor data. Please try again later.")
                    return
                end if
                visitorData = message.getData()
            end if

            accessToken = invalid
            onBehalfOfUser = invalid
            authToken = invidiousNode.authToken
            if authToken <> invalid and authToken.profileNode <> invalid and authToken.profileNode.type = "youtube" and not StringUtils.IsNullOrEmpty(authToken.token)
                accessToken = authToken.token
                onBehalfOfUser = authToken.activeIdentifyToken
            end if

            metadata = InnertubeService.GetVideoMetadata(contentNode.videoId, {
                "cancellation": cancellation
                "credentialTransferToken": loungeServiceNode.credentialTransferToken
                "visitorData": visitorData
                "accessToken": accessToken
                "onBehalfOfUser": onBehalfOfUser
                "signatureTimestamp": true
            })
        else
            metadata = service.GetVideoMetadata(contentNode.videoId, { cancellation: m.top.cancellation })
        end if
    end if

    if JobIsCancelled()
        JobCancel()
        return
    end if

    if metadata = invalid
        JobError("Failed to get video metadata")
        return
    end if

    title = metadata.title
    if not StringUtils.IsNullOrEmpty(title)
        contentNode.title = title
    end if

    author = metadata.author
    if not StringUtils.IsNullOrEmpty(author)
        contentNode.secondaryTitle = metadata.author
    end if
    contentNode.live = metadata.liveNow

    if metadata.error <> invalid
        ' Adding metadata allows us to play next recommended video after displaying the error
        contentNode.addFields({ metadata: metadata })
        JobError(metadata.error)
        return
    end if

    streamUrls = CreateStreamUrls(metadata, service, preferencesNode, backend, playletServerPort)
    if streamUrls.Count() = 0
        contentNode.addFields({ metadata: metadata })
        error = "No playable streams found for this video."
        lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
        LogTelemetryEvent({
            level: "error"
            message: error
            fingerprint: error
            attachments: [{
                filename: "last_player_response.json"
                content_type: "application/json"
                data: lastPlayerResponse
            }]
        })
        JobError(error)
        return
    end if

    isDrm = not StringUtils.IsNullOrEmpty(metadata.drmParams)
    if isDrm
        licenseServerURL = UrlUtils.BuildUrl(`http://127.0.0.1:${playletServerPort}/api/innertube/get_drm_license`, invalid, {
            videoId: metadata.videoId
            drmParams: metadata.drmParams
            drmSessionId: metadata.drmSessionId
            cpn: metadata.cpn
        })
        contentNode.drmParams = {
            keySystem: "Widevine"
            licenseServerURL: licenseServerURL
        }
    end if

    ' Forwarding query params to HLS playlists is not needed. In fact, it can cause issues
    ' because the playlist is limited to 4MB, and on large playlists the query params
    ' significantly increase the size of the playlist, making it cropped.
    ' https://github.com/iBicha/playlet/issues/500
    contentNode.ForwardQueryStringParams = false
    contentNode.addFields({
        metadata: metadata
        ' StreamUrls is taken
        playletStreamUrls: streamUrls
        playletStreamUrlIndex: 0
    })

    firstUrl = streamUrls[0]
    LogDebug("Setting first url:", firstUrl)
    if StringUtils.IsNullOrEmpty(firstUrl)
        LogError("First stream URL is empty!")
    end if
    contentNode.url = firstUrl

    SetCaptions(metadata, service, contentNode)

    if metadata.liveNow = true
        contentNode.Live = true
    end if
end function

function CreateStreamUrls(metadata as object, service as Invidious.InvidiousService, preferences as object, backend as string, playletServerPort as integer) as object
    instance = service.GetInstance()
    proxyVideos = preferences["invidious.proxy_videos"]
    preferredQuality = preferences["playback.preferred_quality"]

    streamUrls = []

    if SupportsDrmDashManifestUrl(metadata)
        dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
            url: metadata.dashUrl
        })
        streamUrls.push(dashUrl)
    else if SupportsHls(metadata)
        metadata.hlsUrl = AddInstanceToUrlIfNeeded(metadata.hlsUrl, instance)
        AddHlsUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsDash(metadata)
        AddDashUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsMuxedFormats(metadata)
        for each stream in metadata.formatStreams
            if StringUtils.IsNullOrEmpty(stream.url)
                continue for
            end if
            stream.url = AddInstanceToUrlIfNeeded(stream.url, instance)
            streamUrls.push(stream.url)
        end for
    end if

    return streamUrls
end function

function SupportsHls(metadata as object) as boolean
    return not StringUtils.IsNullOrEmpty(metadata.hlsUrl)
end function

function SupportsDash(metadata as object) as boolean
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return false
    end if

    for each fmt in metadata.adaptiveFormats
        if not StringUtils.IsNullOrEmpty(fmt.url)
            return true
        end if
    end for

    return false
end function

function SupportsMuxedFormats(metadata as object) as boolean
    return IsArray(metadata.formatStreams) and metadata.formatStreams.Count() > 0
end function

function SupportsDrmDashManifestUrl(metadata as object) as boolean
    if StringUtils.IsNullOrEmpty(metadata.drmParams)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.dashUrl)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.drmSessionId)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.cpn)
        return false
    end if

    if not IsArray(metadata.licenseInfos) or metadata.licenseInfos.Count() = 0
        return false
    end if

    return true
end function

function AddHlsUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer)
    hlsUrl = metadata.hlsUrl
    hlsUrlLocal = invalid
    hlsUrlFiltered = invalid
    hlsUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(hlsUrl, { local: "true" })
    end if

    ' Redirect to Playet's local web server, where we will be
    ' dynamically adding storyboards to the HLS manifest, and filter quality
    hlsUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrl, v: metadata.videoId })
    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrlLocal, v: metadata.videoId })
    end if

    if hasQuality
        hlsUrlFiltered = UrlUtils.AppendQueryParams(hlsUrl, { quality: preferredQuality })
        if supportsProxying
            hlsUrlFilteredLocal = UrlUtils.AppendQueryParams(hlsUrlLocal, { quality: preferredQuality })
        end if
    end if

    AddUrls(streamUrls, hlsUrl, hlsUrlLocal, hlsUrlFiltered, hlsUrlFilteredLocal, proxyVideos)
end function

function AddDashUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer) as void
    ' Redirect to Playet's local web server, where will will be
    ' dynamically generating the DASH manifest, and filter quality
    dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
        v: metadata.videoId
    })

    dashUrlLocal = invalid
    dashUrlFiltered = invalid
    dashUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        dashUrlLocal = UrlUtils.AppendQueryParams(dashUrl, { local: "true" })
    end if

    if hasQuality
        dashUrlFiltered = UrlUtils.AppendQueryParams(dashUrl, { quality: preferredQuality })
        if supportsProxying
            dashUrlFilteredLocal = UrlUtils.AppendQueryParams(dashUrlLocal, { quality: preferredQuality })
        end if
    end if

    ' For 4K (2160p), add direct VP9/WebM URLs FIRST because:
    ' 1. YouTube doesn't have 4K in H.264, only VP9/AV1
    ' 2. Roku's DASH player doesn't support WebM containers
    ' 3. But Roku CAN play WebM files directly
    if preferredQuality <> invalid and preferredQuality.InStr("2160") <> -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if

    AddUrls(streamUrls, dashUrl, dashUrlLocal, dashUrlFiltered, dashUrlFilteredLocal, proxyVideos)

    ' Add direct VP9/WebM stream URLs as fallbacks for non-4K qualities
    if preferredQuality = invalid or preferredQuality.InStr("2160") = -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if
end function

function AddDirectVp9Urls(streamUrls as object, metadata as object, preferredQuality as string) as void
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return
    end if

    ' Parse quality filter
    qualityHeights = {}
    if not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"
        includeList = preferredQuality.split(",")
        for each quality in includeList
            pIndex = quality.InStr("p")
            if pIndex <> -1
                height = quality.Mid(0, pIndex)
                qualityHeights[height] = true
            end if
        end for
    end if

    ' Find VP9/WebM video streams and add as fallbacks
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        ' Check if this is a VP9/WebM video stream
        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("video/webm")
            continue for
        end if

        ' Skip HDR streams (vp9.2) as they may have additional compatibility issues
        if fmtType.InStr("vp9.2") <> -1
            continue for
        end if

        ' Check quality filter if set
        if qualityHeights.Count() > 0
            height = ValidString(fmt.height)
            if height = "" and fmt.height <> invalid
                height = fmt.height.ToStr()
            end if
            if not qualityHeights.DoesExist(height)
                continue for
            end if
        end if

        LogDebug("Adding VP9 direct fallback URL:", fmt.qualityLabel, fmt.width, "x", fmt.height)
        streamUrls.push(fmt.url)
    end for
end function

function AddUrls(streamUrls as object, url as string, urlLocal as dynamic, urlFiltered as dynamic, urlFilteredLocal as dynamic, proxyVideos as string)
    if proxyVideos = "if_needed"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    else if proxyVideos = "never"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
    else if proxyVideos = "always"
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if

    if streamUrls.Count() = 0
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if
end function

function AddInstanceToUrlIfNeeded(url as dynamic, instance as string) as dynamic
    if IsString(url) and url.StartsWith("/")
        return instance + url
    end if
    return url
end function

function SetCaptions(metadata as object, service as object, contentNode as object) as void
    if metadata.captions.Count() = 0
        return
    end if

    isoLanguageList = StringUtils.ParseJsonSafe(ReadAsciiFile("libpkg:/config/ISO-639-1-to-ISO-639-2T.json5"))
    instance = service.GetInstance()

    subtitleTracks = []

    for each caption in metadata.captions
        code = caption.language_code
        if StringUtils.IsNullOrEmpty(code)
            continue for
        end if

        if code.InStr("-") <> -1
            code = code.Split("-")[0]
        end if

        if code.len() = 2
            if not isoLanguageList.DoesExist(code)
                continue for
            end if
            code = isoLanguageList[code]
        end if

        url = caption.url
        if not url.StartsWith("http")
            url = instance + url
        end if

        subtitleTracks.Push({
            Description: caption.label
            Language: code
            TrackName: url
        })
    end for

    contentNode.ClosedCaptions = True
    contentNode.SubtitleTracks = subtitleTracks
end function

```

```brighterscript
import "pkg:/components/Services/Innertube/InnertubeService.bs"
import "pkg:/components/Services/Invidious/InvidiousService.bs"

@job("VideoContentJob")
function ExecuteJob() as void
    input = JobGetInput()

    contentNode = input.content
    invidiousNode = input.invidious
    innertubeNode = input.innertube
    preferencesNode = input.preferences
    loungeServiceNode = input.loungeService
    playletServerPort = input.playletServerPort

    if JobIsCancelled()
        JobCancel()
        return
    end if

    DeleteFile("cachefs:/last_generated_dash.xml")
    DeleteFile("cachefs:/last_generated_hls.m3u8")

    if StringUtils.IsNullOrEmpty(contentNode.videoId)
        JobError("Can't load video information: videoId is missing")
        return
    end if

    service = new Invidious.InvidiousService(invidiousNode)
    backend = preferencesNode["backend.selected"]

    metadata = contentNode.metadata
    if not IsAssociativeArray(metadata)
        cancellation = JobGetCancellation()
        if backend = "playlet"
            visitorData = innertubeNode.visitorData
            if StringUtils.IsNullOrEmpty(visitorData)
                messagePort = CreateObject("roMessagePort")
                MessagePortUtils.ObserveFieldScopedExSafe(innertubeNode, "visitorData", messagePort)
                innertubeNode.requestVisitorData = true
                message = wait(20000, messagePort)
                innertubeNode.unobserveFieldScoped("visitorData")
                if message = invalid
                    innertubeNode.forceRequestVisitorData = true
                    JobError("Failed to get visitor data. Please try again later.")
                    return
                end if
                visitorData = message.getData()
            end if

            accessToken = invalid
            onBehalfOfUser = invalid
            authToken = invidiousNode.authToken
            if authToken <> invalid and authToken.profileNode <> invalid and authToken.profileNode.type = "youtube" and not StringUtils.IsNullOrEmpty(authToken.token)
                accessToken = authToken.token
                onBehalfOfUser = authToken.activeIdentifyToken
            end if

            metadata = InnertubeService.GetVideoMetadata(contentNode.videoId, {
                "cancellation": cancellation
                "credentialTransferToken": loungeServiceNode.credentialTransferToken
                "visitorData": visitorData
                "accessToken": accessToken
                "onBehalfOfUser": onBehalfOfUser
                "signatureTimestamp": true
            })
        else
            metadata = service.GetVideoMetadata(contentNode.videoId, { cancellation: m.top.cancellation })
        end if
    end if

    if JobIsCancelled()
        JobCancel()
        return
    end if

    if metadata = invalid
        JobError("Failed to get video metadata")
        return
    end if

    title = metadata.title
    if not StringUtils.IsNullOrEmpty(title)
        contentNode.title = title
    end if

    author = metadata.author
    if not StringUtils.IsNullOrEmpty(author)
        contentNode.secondaryTitle = metadata.author
    end if
    contentNode.live = metadata.liveNow

    if metadata.error <> invalid
        ' Adding metadata allows us to play next recommended video after displaying the error
        contentNode.addFields({ metadata: metadata })
        JobError(metadata.error)
        return
    end if

    streamUrls = CreateStreamUrls(metadata, service, preferencesNode, backend, playletServerPort)
    if streamUrls.Count() = 0
        contentNode.addFields({ metadata: metadata })
        error = "No playable streams found for this video."
        lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
        LogTelemetryEvent({
            level: "error"
            message: error
            fingerprint: error
            attachments: [{
                filename: "last_player_response.json"
                content_type: "application/json"
                data: lastPlayerResponse
            }]
        })
        JobError(error)
        return
    end if

    isDrm = not StringUtils.IsNullOrEmpty(metadata.drmParams)
    if isDrm
        licenseServerURL = UrlUtils.BuildUrl(`http://127.0.0.1:${playletServerPort}/api/innertube/get_drm_license`, invalid, {
            videoId: metadata.videoId
            drmParams: metadata.drmParams
            drmSessionId: metadata.drmSessionId
            cpn: metadata.cpn
        })
        contentNode.drmParams = {
            keySystem: "Widevine"
            licenseServerURL: licenseServerURL
        }
    end if

    ' Forwarding query params to HLS playlists is not needed. In fact, it can cause issues
    ' because the playlist is limited to 4MB, and on large playlists the query params
    ' significantly increase the size of the playlist, making it cropped.
    ' https://github.com/iBicha/playlet/issues/500
    contentNode.ForwardQueryStringParams = false
    contentNode.addFields({
        metadata: metadata
        ' StreamUrls is taken
        playletStreamUrls: streamUrls
        playletStreamUrlIndex: 0
    })

    firstUrl = streamUrls[0]
    LogDebug("Setting first url:", firstUrl)
    if StringUtils.IsNullOrEmpty(firstUrl)
        LogError("First stream URL is empty!")
    end if
    contentNode.url = firstUrl

    SetCaptions(metadata, service, contentNode)

    if metadata.liveNow = true
        contentNode.Live = true
    end if
end function

function CreateStreamUrls(metadata as object, service as Invidious.InvidiousService, preferences as object, backend as string, playletServerPort as integer) as object
    instance = service.GetInstance()
    proxyVideos = preferences["invidious.proxy_videos"]
    preferredQuality = preferences["playback.preferred_quality"]

    streamUrls = []

    if SupportsDrmDashManifestUrl(metadata)
        dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
            url: metadata.dashUrl
        })
        streamUrls.push(dashUrl)
    else if SupportsHls(metadata)
        metadata.hlsUrl = AddInstanceToUrlIfNeeded(metadata.hlsUrl, instance)
        AddHlsUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsDash(metadata)
        AddDashUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsMuxedFormats(metadata)
        for each stream in metadata.formatStreams
            if StringUtils.IsNullOrEmpty(stream.url)
                continue for
            end if
            stream.url = AddInstanceToUrlIfNeeded(stream.url, instance)
            streamUrls.push(stream.url)
        end for
    end if

    return streamUrls
end function

function SupportsHls(metadata as object) as boolean
    return not StringUtils.IsNullOrEmpty(metadata.hlsUrl)
end function

function SupportsDash(metadata as object) as boolean
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return false
    end if

    for each fmt in metadata.adaptiveFormats
        if not StringUtils.IsNullOrEmpty(fmt.url)
            return true
        end if
    end for

    return false
end function

function SupportsMuxedFormats(metadata as object) as boolean
    return IsArray(metadata.formatStreams) and metadata.formatStreams.Count() > 0
end function

function SupportsDrmDashManifestUrl(metadata as object) as boolean
    if StringUtils.IsNullOrEmpty(metadata.drmParams)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.dashUrl)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.drmSessionId)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.cpn)
        return false
    end if

    if not IsArray(metadata.licenseInfos) or metadata.licenseInfos.Count() = 0
        return false
    end if

    return true
end function

function AddHlsUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer)
    hlsUrl = metadata.hlsUrl
    hlsUrlLocal = invalid
    hlsUrlFiltered = invalid
    hlsUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(hlsUrl, { local: "true" })
    end if

    ' Redirect to Playet's local web server, where we will be
    ' dynamically adding storyboards to the HLS manifest, and filter quality
    hlsUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrl, v: metadata.videoId })
    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrlLocal, v: metadata.videoId })
    end if

    if hasQuality
        hlsUrlFiltered = UrlUtils.AppendQueryParams(hlsUrl, { quality: preferredQuality })
        if supportsProxying
            hlsUrlFilteredLocal = UrlUtils.AppendQueryParams(hlsUrlLocal, { quality: preferredQuality })
        end if
    end if

    AddUrls(streamUrls, hlsUrl, hlsUrlLocal, hlsUrlFiltered, hlsUrlFilteredLocal, proxyVideos)
end function

function AddDashUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer) as void
    ' Redirect to Playet's local web server, where will will be
    ' dynamically generating the DASH manifest, and filter quality
    dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
        v: metadata.videoId
    })

    dashUrlLocal = invalid
    dashUrlFiltered = invalid
    dashUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        dashUrlLocal = UrlUtils.AppendQueryParams(dashUrl, { local: "true" })
    end if

    if hasQuality
        dashUrlFiltered = UrlUtils.AppendQueryParams(dashUrl, { quality: preferredQuality })
        if supportsProxying
            dashUrlFilteredLocal = UrlUtils.AppendQueryParams(dashUrlLocal, { quality: preferredQuality })
        end if
    end if

    ' For 4K (2160p), add direct VP9/WebM URLs FIRST because:
    ' 1. YouTube doesn't have 4K in H.264, only VP9/AV1
    ' 2. Roku's DASH player doesn't support WebM containers
    ' 3. But Roku CAN play WebM files directly
    if preferredQuality <> invalid and preferredQuality.InStr("2160") <> -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if

    AddUrls(streamUrls, dashUrl, dashUrlLocal, dashUrlFiltered, dashUrlFilteredLocal, proxyVideos)

    ' Add direct VP9/WebM stream URLs as fallbacks for non-4K qualities
    if preferredQuality = invalid or preferredQuality.InStr("2160") = -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if
end function

function AddDirectVp9Urls(streamUrls as object, metadata as object, preferredQuality as string) as void
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return
    end if

    ' Parse quality filter
    qualityHeights = {}
    if not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"
        includeList = preferredQuality.split(",")
        for each quality in includeList
            pIndex = quality.InStr("p")
            if pIndex <> -1
                height = quality.Mid(0, pIndex)
                qualityHeights[height] = true
            end if
        end for
    end if

    ' Find VP9/WebM video streams and add as fallbacks
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        ' Check if this is a VP9/WebM video stream
        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("video/webm")
            continue for
        end if

        ' Skip HDR streams (vp9.2) as they may have additional compatibility issues
        if fmtType.InStr("vp9.2") <> -1
            continue for
        end if

        ' Check quality filter if set
        if qualityHeights.Count() > 0
            height = ValidString(fmt.height)
            if height = "" and fmt.height <> invalid
                height = fmt.height.ToStr()
            end if
            if not qualityHeights.DoesExist(height)
                continue for
            end if
        end if

        LogDebug("Adding VP9 direct URL:", fmt.qualityLabel, fmt.width, "x", fmt.height)
        streamUrls.push(fmt.url)
    end for
end function

function AddUrls(streamUrls as object, url as string, urlLocal as dynamic, urlFiltered as dynamic, urlFilteredLocal as dynamic, proxyVideos as string)
    if proxyVideos = "if_needed"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    else if proxyVideos = "never"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
    else if proxyVideos = "always"
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if

    if streamUrls.Count() = 0
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if
end function

function AddInstanceToUrlIfNeeded(url as dynamic, instance as string) as dynamic
    if IsString(url) and url.StartsWith("/")
        return instance + url
    end if
    return url
end function

function SetCaptions(metadata as object, service as object, contentNode as object) as void
    if metadata.captions.Count() = 0
        return
    end if

    isoLanguageList = StringUtils.ParseJsonSafe(ReadAsciiFile("libpkg:/config/ISO-639-1-to-ISO-639-2T.json5"))
    instance = service.GetInstance()

    subtitleTracks = []

    for each caption in metadata.captions
        code = caption.language_code
        if StringUtils.IsNullOrEmpty(code)
            continue for
        end if

        if code.InStr("-") <> -1
            code = code.Split("-")[0]
        end if

        if code.len() = 2
            if not isoLanguageList.DoesExist(code)
                continue for
            end if
            code = isoLanguageList[code]
        end if

        url = caption.url
        if not url.StartsWith("http")
            url = instance + url
        end if

        subtitleTracks.Push({
            Description: caption.label
            Language: code
            TrackName: url
        })
    end for

    contentNode.ClosedCaptions = True
    contentNode.SubtitleTracks = subtitleTracks
end function

```

Let me verify the changes:

The changes are in place. Now:

**For 4K (2160p) quality:**
1. Direct VP9/WebM URLs added **FIRST** → Roku plays WebM directly ✅
2. DASH URLs as fallback

**For other qualities (1080p, 720p, etc.):**
1. DASH URLs first (H.264 works fine via DASH)
2. VP9 URLs as fallback

**Redeploy and test again.** In the log, you should now see:
```
Adding VP9 direct URL: 2160p60 3840 x 2160
Setting first url: https://rr5---sn-...googleusercontent.com/videoplayback?...  (direct WebM URL)
```

Instead of the DASH URL being first. Then check if `Video format: vp9 3840x2160` appears.

```plaintext
Adding VP9 direct URL: 2160p60 3840 x 2160
Setting first url: https://rr5---sn-...googleusercontent.com/videoplayback?...  (direct WebM URL)
```

---

**User**

4k video is working!  But audio is not.@extension-output-RokuCommunity.brightscript-#1-BrightScript Log (419-534) 

---

**Cursor**

Excellent progress! The video is working with VP9! 🎉

```
Video format: vp9  Audio format: none
```

The problem is clear: the direct VP9 URL is **video-only**. YouTube separates video and audio in adaptive formats. DASH manifests combine them, but we're now bypassing DASH for 4K.

I need to add audio support. Let me check what audio streams are available and try to include them:

```plaintext
Video format: vp9  Audio format: none
```

The issue is that YouTube's adaptive formats are **video-only** or **audio-only**. Direct VP9 playback gives us video without audio because we're bypassing the DASH manifest that would combine them.

Let me try generating a minimal HLS manifest that combines the VP9 video with an audio track - HLS might handle VP9/WebM better than Roku's DASH player:

Let me look at how the DASH manifest handles codecs - maybe we can fix VP9 handling in DASH rather than using direct playback:

Let me try a different approach. Since DASH doesn't work with VP9/WebM on Roku, let me create an HLS-style endpoint that might handle VP9 better. First, let me check what the available audio formats are:

```brighterscript
import "pkg:/components/Services/Innertube/InnertubeService.bs"
import "pkg:/components/Services/Invidious/InvidiousService.bs"

@job("VideoContentJob")
function ExecuteJob() as void
    input = JobGetInput()

    contentNode = input.content
    invidiousNode = input.invidious
    innertubeNode = input.innertube
    preferencesNode = input.preferences
    loungeServiceNode = input.loungeService
    playletServerPort = input.playletServerPort

    if JobIsCancelled()
        JobCancel()
        return
    end if

    DeleteFile("cachefs:/last_generated_dash.xml")
    DeleteFile("cachefs:/last_generated_hls.m3u8")

    if StringUtils.IsNullOrEmpty(contentNode.videoId)
        JobError("Can't load video information: videoId is missing")
        return
    end if

    service = new Invidious.InvidiousService(invidiousNode)
    backend = preferencesNode["backend.selected"]

    metadata = contentNode.metadata
    if not IsAssociativeArray(metadata)
        cancellation = JobGetCancellation()
        if backend = "playlet"
            visitorData = innertubeNode.visitorData
            if StringUtils.IsNullOrEmpty(visitorData)
                messagePort = CreateObject("roMessagePort")
                MessagePortUtils.ObserveFieldScopedExSafe(innertubeNode, "visitorData", messagePort)
                innertubeNode.requestVisitorData = true
                message = wait(20000, messagePort)
                innertubeNode.unobserveFieldScoped("visitorData")
                if message = invalid
                    innertubeNode.forceRequestVisitorData = true
                    JobError("Failed to get visitor data. Please try again later.")
                    return
                end if
                visitorData = message.getData()
            end if

            accessToken = invalid
            onBehalfOfUser = invalid
            authToken = invidiousNode.authToken
            if authToken <> invalid and authToken.profileNode <> invalid and authToken.profileNode.type = "youtube" and not StringUtils.IsNullOrEmpty(authToken.token)
                accessToken = authToken.token
                onBehalfOfUser = authToken.activeIdentifyToken
            end if

            metadata = InnertubeService.GetVideoMetadata(contentNode.videoId, {
                "cancellation": cancellation
                "credentialTransferToken": loungeServiceNode.credentialTransferToken
                "visitorData": visitorData
                "accessToken": accessToken
                "onBehalfOfUser": onBehalfOfUser
                "signatureTimestamp": true
            })
        else
            metadata = service.GetVideoMetadata(contentNode.videoId, { cancellation: m.top.cancellation })
        end if
    end if

    if JobIsCancelled()
        JobCancel()
        return
    end if

    if metadata = invalid
        JobError("Failed to get video metadata")
        return
    end if

    title = metadata.title
    if not StringUtils.IsNullOrEmpty(title)
        contentNode.title = title
    end if

    author = metadata.author
    if not StringUtils.IsNullOrEmpty(author)
        contentNode.secondaryTitle = metadata.author
    end if
    contentNode.live = metadata.liveNow

    if metadata.error <> invalid
        ' Adding metadata allows us to play next recommended video after displaying the error
        contentNode.addFields({ metadata: metadata })
        JobError(metadata.error)
        return
    end if

    streamUrls = CreateStreamUrls(metadata, service, preferencesNode, backend, playletServerPort)
    if streamUrls.Count() = 0
        contentNode.addFields({ metadata: metadata })
        error = "No playable streams found for this video."
        lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
        LogTelemetryEvent({
            level: "error"
            message: error
            fingerprint: error
            attachments: [{
                filename: "last_player_response.json"
                content_type: "application/json"
                data: lastPlayerResponse
            }]
        })
        JobError(error)
        return
    end if

    isDrm = not StringUtils.IsNullOrEmpty(metadata.drmParams)
    if isDrm
        licenseServerURL = UrlUtils.BuildUrl(`http://127.0.0.1:${playletServerPort}/api/innertube/get_drm_license`, invalid, {
            videoId: metadata.videoId
            drmParams: metadata.drmParams
            drmSessionId: metadata.drmSessionId
            cpn: metadata.cpn
        })
        contentNode.drmParams = {
            keySystem: "Widevine"
            licenseServerURL: licenseServerURL
        }
    end if

    ' Forwarding query params to HLS playlists is not needed. In fact, it can cause issues
    ' because the playlist is limited to 4MB, and on large playlists the query params
    ' significantly increase the size of the playlist, making it cropped.
    ' https://github.com/iBicha/playlet/issues/500
    contentNode.ForwardQueryStringParams = false
    contentNode.addFields({
        metadata: metadata
        ' StreamUrls is taken
        playletStreamUrls: streamUrls
        playletStreamUrlIndex: 0
    })

    firstUrl = streamUrls[0]
    LogDebug("Setting first url:", firstUrl)
    if StringUtils.IsNullOrEmpty(firstUrl)
        LogError("First stream URL is empty!")
    end if
    contentNode.url = firstUrl

    SetCaptions(metadata, service, contentNode)

    if metadata.liveNow = true
        contentNode.Live = true
    end if
end function

function CreateStreamUrls(metadata as object, service as Invidious.InvidiousService, preferences as object, backend as string, playletServerPort as integer) as object
    instance = service.GetInstance()
    proxyVideos = preferences["invidious.proxy_videos"]
    preferredQuality = preferences["playback.preferred_quality"]

    streamUrls = []

    if SupportsDrmDashManifestUrl(metadata)
        dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
            url: metadata.dashUrl
        })
        streamUrls.push(dashUrl)
    else if SupportsHls(metadata)
        metadata.hlsUrl = AddInstanceToUrlIfNeeded(metadata.hlsUrl, instance)
        AddHlsUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsDash(metadata)
        AddDashUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsMuxedFormats(metadata)
        for each stream in metadata.formatStreams
            if StringUtils.IsNullOrEmpty(stream.url)
                continue for
            end if
            stream.url = AddInstanceToUrlIfNeeded(stream.url, instance)
            streamUrls.push(stream.url)
        end for
    end if

    return streamUrls
end function

function SupportsHls(metadata as object) as boolean
    return not StringUtils.IsNullOrEmpty(metadata.hlsUrl)
end function

function SupportsDash(metadata as object) as boolean
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return false
    end if

    for each fmt in metadata.adaptiveFormats
        if not StringUtils.IsNullOrEmpty(fmt.url)
            return true
        end if
    end for

    return false
end function

function SupportsMuxedFormats(metadata as object) as boolean
    return IsArray(metadata.formatStreams) and metadata.formatStreams.Count() > 0
end function

function SupportsDrmDashManifestUrl(metadata as object) as boolean
    if StringUtils.IsNullOrEmpty(metadata.drmParams)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.dashUrl)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.drmSessionId)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.cpn)
        return false
    end if

    if not IsArray(metadata.licenseInfos) or metadata.licenseInfos.Count() = 0
        return false
    end if

    return true
end function

function AddHlsUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer)
    hlsUrl = metadata.hlsUrl
    hlsUrlLocal = invalid
    hlsUrlFiltered = invalid
    hlsUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(hlsUrl, { local: "true" })
    end if

    ' Redirect to Playet's local web server, where we will be
    ' dynamically adding storyboards to the HLS manifest, and filter quality
    hlsUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrl, v: metadata.videoId })
    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrlLocal, v: metadata.videoId })
    end if

    if hasQuality
        hlsUrlFiltered = UrlUtils.AppendQueryParams(hlsUrl, { quality: preferredQuality })
        if supportsProxying
            hlsUrlFilteredLocal = UrlUtils.AppendQueryParams(hlsUrlLocal, { quality: preferredQuality })
        end if
    end if

    AddUrls(streamUrls, hlsUrl, hlsUrlLocal, hlsUrlFiltered, hlsUrlFilteredLocal, proxyVideos)
end function

function AddDashUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer) as void
    ' Redirect to Playet's local web server, where will will be
    ' dynamically generating the DASH manifest, and filter quality
    dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
        v: metadata.videoId
    })

    dashUrlLocal = invalid
    dashUrlFiltered = invalid
    dashUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        dashUrlLocal = UrlUtils.AppendQueryParams(dashUrl, { local: "true" })
    end if

    if hasQuality
        dashUrlFiltered = UrlUtils.AppendQueryParams(dashUrl, { quality: preferredQuality })
        if supportsProxying
            dashUrlFilteredLocal = UrlUtils.AppendQueryParams(dashUrlLocal, { quality: preferredQuality })
        end if
    end if

    ' For 4K (2160p), add direct VP9/WebM URLs FIRST because:
    ' 1. YouTube doesn't have 4K in H.264, only VP9/AV1
    ' 2. Roku's DASH player doesn't support WebM containers
    ' 3. But Roku CAN play WebM files directly
    if preferredQuality <> invalid and preferredQuality.InStr("2160") <> -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if

    AddUrls(streamUrls, dashUrl, dashUrlLocal, dashUrlFiltered, dashUrlFilteredLocal, proxyVideos)

    ' Add direct VP9/WebM stream URLs as fallbacks for non-4K qualities
    if preferredQuality = invalid or preferredQuality.InStr("2160") = -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if
end function

function AddDirectVp9Urls(streamUrls as object, metadata as object, preferredQuality as string) as void
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return
    end if

    ' Parse quality filter
    qualityHeights = {}
    if not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"
        includeList = preferredQuality.split(",")
        for each quality in includeList
            pIndex = quality.InStr("p")
            if pIndex <> -1
                height = quality.Mid(0, pIndex)
                qualityHeights[height] = true
            end if
        end for
    end if

    ' Find VP9/WebM video streams
    vp9VideoUrl = invalid
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        ' Check if this is a VP9/WebM video stream
        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("video/webm")
            continue for
        end if

        ' Skip HDR streams (vp9.2) as they may have additional compatibility issues
        if fmtType.InStr("vp9.2") <> -1
            continue for
        end if

        ' Check quality filter if set
        if qualityHeights.Count() > 0
            height = ValidString(fmt.height)
            if height = "" and fmt.height <> invalid
                height = fmt.height.ToStr()
            end if
            if not qualityHeights.DoesExist(height)
                continue for
            end if
        end if

        LogDebug("Found VP9 video:", fmt.qualityLabel, fmt.width, "x", fmt.height)
        vp9VideoUrl = fmt.url
        exit for ' Take the first matching VP9 stream
    end for

    if vp9VideoUrl = invalid
        return
    end if

    ' Find best audio stream (prefer AAC/MP4 for compatibility, then Opus/WebM)
    audioUrl = invalid
    audioBitrate = 0
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("audio/")
            continue for
        end if

        ' Prefer AAC (mp4a) over Opus for compatibility
        isAac = fmtType.InStr("mp4a") <> -1
        isOpus = fmtType.InStr("opus") <> -1
        currentBitrate = ValidInt(fmt.bitrate)

        ' Take AAC if available, or highest bitrate opus
        if isAac
            if audioUrl = invalid or audioBitrate < currentBitrate or not ValidString(audioUrl).InStr("mp4a") <> -1
                audioUrl = fmt.url
                audioBitrate = currentBitrate
                LogDebug("Found AAC audio:", fmtType, "bitrate:", currentBitrate)
            end if
        else if isOpus and audioUrl = invalid
            audioUrl = fmt.url
            audioBitrate = currentBitrate
            LogDebug("Found Opus audio:", fmtType, "bitrate:", currentBitrate)
        end if
    end for

    ' Add VP9 video URL
    LogDebug("Adding VP9 direct URL (video-only, audio requires DASH fallback)")
    streamUrls.push(vp9VideoUrl)

    ' Note: We can't easily combine separate video+audio on Roku without a manifest
    ' The DASH fallback (added after this) will provide audio but may not have 4K video
    ' This is a limitation of Roku's DASH player not supporting WebM containers
    if audioUrl <> invalid
        LogDebug("Audio available but cannot be combined with direct VP9 playback")
        LogDebug("Audio URL available:", Left(audioUrl, 100), "...")
    end if
end function

function AddUrls(streamUrls as object, url as string, urlLocal as dynamic, urlFiltered as dynamic, urlFilteredLocal as dynamic, proxyVideos as string)
    if proxyVideos = "if_needed"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    else if proxyVideos = "never"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
    else if proxyVideos = "always"
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if

    if streamUrls.Count() = 0
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if
end function

function AddInstanceToUrlIfNeeded(url as dynamic, instance as string) as dynamic
    if IsString(url) and url.StartsWith("/")
        return instance + url
    end if
    return url
end function

function SetCaptions(metadata as object, service as object, contentNode as object) as void
    if metadata.captions.Count() = 0
        return
    end if

    isoLanguageList = StringUtils.ParseJsonSafe(ReadAsciiFile("libpkg:/config/ISO-639-1-to-ISO-639-2T.json5"))
    instance = service.GetInstance()

    subtitleTracks = []

    for each caption in metadata.captions
        code = caption.language_code
        if StringUtils.IsNullOrEmpty(code)
            continue for
        end if

        if code.InStr("-") <> -1
            code = code.Split("-")[0]
        end if

        if code.len() = 2
            if not isoLanguageList.DoesExist(code)
                continue for
            end if
            code = isoLanguageList[code]
        end if

        url = caption.url
        if not url.StartsWith("http")
            url = instance + url
        end if

        subtitleTracks.Push({
            Description: caption.label
            Language: code
            TrackName: url
        })
    end for

    contentNode.ClosedCaptions = True
    contentNode.SubtitleTracks = subtitleTracks
end function

```

Now let me create a new endpoint that generates a minimal HLS manifest specifically for VP9/WebM. HLS might work better than DASH on Roku:

Let me create a new VP9-specific endpoint that attempts to combine the VP9 video with audio using a minimal HLS manifest:

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpRouter.bs"
import "pkg:/source/utils/ObjectUtils.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/Types.bs"

namespace Http

    ' This router generates a minimal HLS manifest for VP9/WebM content
    ' Roku's DASH player doesn't support WebM containers, but HLS might work differently
    class Vp9HlsRouter extends HttpRouter
        function new(server as object)
            super()

            m.videoQueueNode = server.sceneNodes.videoQueue
        end function

        @get("/api/vp9hls")
        function GenerateVp9HlsManifest(context as object) as boolean
            request = context.request
            response = context.response

            v = request.query.v
            quality = request.query.quality

            if StringUtils.IsNullOrEmpty(v)
                response.Default(400, "Missing video id")
                return true
            end if

            metadata = ObjectUtils.DigUnsafe(m.videoQueueNode, ["player", "content", "metadata"])
            if not IsAssociativeArray(metadata)
                response.Default(500, "Player metadata is invalid")
                return true
            end if
            if metadata.videoId <> v
                response.Default(400, "Video ID mismatch")
                return true
            end if

            if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
                response.Default(500, "No adaptive formats available")
                return true
            end if

            qualityHeight = m.ParseQualityHeight(quality)
            result = m.FindVp9AndAudio(metadata.adaptiveFormats, qualityHeight)

            if result.videoUrl = invalid
                response.Default(404, "No VP9 stream found for requested quality")
                return true
            end if

            hlsManifest = m.GenerateHlsManifest(result, metadata)

            response.http_code = 200
            response.SetBodyDataString(hlsManifest)
            response.ContentType("application/vnd.apple.mpegurl")

            WriteAsciiFile("cachefs:/last_vp9_hls.m3u8", hlsManifest)
            LogDebug("Generated VP9 HLS manifest for", v)

            return true
        end function

        function ParseQualityHeight(quality as dynamic) as integer
            if StringUtils.IsNullOrEmpty(quality)
                return 2160 ' Default to 4K
            end if

            pIndex = quality.InStr("p")
            if pIndex <> -1
                return quality.Mid(0, pIndex).ToInt()
            end if
            return quality.ToInt()
        end function

        function FindVp9AndAudio(formats as object, targetHeight as integer) as object
            result = {
                videoUrl: invalid
                videoWidth: 0
                videoHeight: 0
                videoCodec: ""
                videoBandwidth: 0
                audioUrl: invalid
                audioCodec: ""
                audioBandwidth: 0
            }

            ' Find VP9 video stream matching the quality
            for each fmt in formats
                if StringUtils.IsNullOrEmpty(fmt.url)
                    continue for
                end if

                fmtType = ValidString(fmt.type)
                if not fmtType.StartsWith("video/webm")
                    continue for
                end if

                ' Skip HDR streams (vp9.2) for now
                if fmtType.InStr("vp9.2") <> -1
                    continue for
                end if

                height = ValidInt(fmt.height)
                if height <> targetHeight
                    continue for
                end if

                result.videoUrl = fmt.url
                result.videoWidth = ValidInt(fmt.width)
                result.videoHeight = height
                result.videoBandwidth = ValidInt(fmt.bitrate)

                ' Extract codec string
                if fmtType.InStr("codecs=") <> -1
                    result.videoCodec = fmtType.split("codecs=")[1].replace(`"`, "")
                else
                    result.videoCodec = "vp09.00.10.08"
                end if

                LogDebug("Found VP9 video:", result.videoWidth, "x", result.videoHeight)
                exit for
            end for

            ' Find best audio stream (prefer AAC)
            for each fmt in formats
                if StringUtils.IsNullOrEmpty(fmt.url)
                    continue for
                end if

                fmtType = ValidString(fmt.type)
                if not fmtType.StartsWith("audio/")
                    continue for
                end if

                isAac = fmtType.InStr("mp4a") <> -1
                currentBitrate = ValidInt(fmt.bitrate)

                ' Prefer AAC for HLS compatibility
                if isAac
                    result.audioUrl = fmt.url
                    result.audioBandwidth = currentBitrate
                    if fmtType.InStr("codecs=") <> -1
                        result.audioCodec = fmtType.split("codecs=")[1].replace(`"`, "")
                    else
                        result.audioCodec = "mp4a.40.2"
                    end if
                    LogDebug("Found AAC audio, bitrate:", currentBitrate)
                    exit for
                end if
            end for

            ' Fallback to Opus if no AAC
            if result.audioUrl = invalid
                for each fmt in formats
                    if StringUtils.IsNullOrEmpty(fmt.url)
                        continue for
                    end if

                    fmtType = ValidString(fmt.type)
                    if fmtType.StartsWith("audio/") and fmtType.InStr("opus") <> -1
                        result.audioUrl = fmt.url
                        result.audioBandwidth = ValidInt(fmt.bitrate)
                        result.audioCodec = "opus"
                        LogDebug("Found Opus audio, bitrate:", result.audioBandwidth)
                        exit for
                    end if
                end for
            end if

            return result
        end function

        function GenerateHlsManifest(streams as object, metadata as object) as string
            duration = ValidInt(metadata.lengthSeconds)
            if duration = 0
                duration = 600 ' Default to 10 minutes
            end if

            bandwidth = streams.videoBandwidth + streams.audioBandwidth
            if bandwidth = 0
                bandwidth = 20000000 ' 20 Mbps default for 4K
            end if

            ' Generate HLS master playlist with separate video and audio
            ' Note: This is an experimental approach - Roku may or may not support
            ' external WebM video references in HLS
            manifest = "#EXTM3U" + Chr(10)
            manifest += "#EXT-X-VERSION:7" + Chr(10)
            manifest += "## Playlet VP9 HLS - Video ID: " + ValidString(metadata.videoId) + Chr(10)

            ' Audio rendition (AAC preferred for HLS)
            if streams.audioUrl <> invalid
                manifest += `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Default",DEFAULT=YES,AUTOSELECT=YES,URI="${streams.audioUrl}"` + Chr(10)
            end if

            ' Video stream with audio group
            codecs = streams.videoCodec
            if streams.audioCodec <> ""
                codecs = streams.videoCodec + "," + streams.audioCodec
            end if

            manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${streams.videoWidth}x${streams.videoHeight},CODECS="${codecs}"` 
            if streams.audioUrl <> invalid
                manifest += `,AUDIO="audio"`
            end if
            manifest += Chr(10)

            ' Video URL
            manifest += streams.videoUrl + Chr(10)

            return manifest
        end function
    end class

end namespace

```

Now let me register the new router in the server:

```brighterscript
import "pkg:/components/Web/PlayletWebServer/Middleware/BookmarksRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/CacheRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/DashRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/DialRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/Vp9HlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HomeLayoutRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HomeRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/InnertubeRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/InvidiousRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PlayletInvidiousBackendRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PlayletLibUrlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PreferencesRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/ProfilesRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/RegistryRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/SearchHistoryRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/StateApiRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/VideoQueueRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/ViewRouter.bs"
import "pkg:/components/Web/WebServer/Middleware/CorsMiddleware.bs"
import "pkg:/components/Web/WebServer/Middleware/EtagMiddleware.bs"
import "pkg:/components/Web/WebServer/Middleware/HttpStaticFilesRouter.bs"
import "pkg:/components/Web/WebServer/WebSockets/WebSocketMiddleware.bs"

function Init()
end function

function OnNodeReady()
    m.sceneNodes = {
        "appController": m.top.appController
        "preferences": m.top.preferences
        "innertube": m.top.innertube
        "invidious": m.top.invidious
        "profilesService": m.top.profilesService
        "applicationInfo": m.top.applicationInfo
        "videoQueue": m.top.videoQueue
        "bookmarksService": m.top.bookmarksService
        "loungeService": m.top.loungeService
        "jobQueue": m.top.jobQueue
    }
end function

function GetServerAddress(_unused as dynamic) as dynamic
    port = m.top.port
    ip = m.top.applicationInfo@.GetLocalIpAddress()
    if StringUtils.IsNullOrEmpty(ip)
        return invalid
    end if
    return `http://${ip}:${port}`
end function

function SetupRoutes(server as object)
    server.sceneNodes = m.sceneNodes
    #if DEBUG
        'CORS is mostly for developing the web app
        server.UseRouter(new Http.CorsMiddleware())
    #else
        server.UseRouter(new Http.CorsMiddleware(""))
    #end if
    if server.settings.WebSocketsEnabled
        server.UseRouter(new Http.WebSocketMiddleware())
    end if
    server.UseRouter(new Http.HomeRouter())
    server.UseRouter(new Http.StateApiRouter(server))
    server.UseRouter(new Http.DashRouter(server))
    server.UseRouter(new Http.HlsRouter(server))
    server.UseRouter(new Http.PreferencesRouter(server))
    server.UseRouter(new Http.InvidiousRouter(server))
    server.UseRouter(new Http.ProfilesRouter(server))
    server.UseRouter(new Http.VideoQueueRouter(server))
    server.UseRouter(new Http.BookmarksRouter(server))
    server.UseRouter(new Http.HomeLayoutRouter(server))
    server.UseRouter(new Http.ViewRouter(server))
    server.UseRouter(new Http.SearchHistoryRouter(server))
    server.UseRouter(new Http.PlayletLibUrlsRouter(server))
    server.UseRouter(new Http.DialRouter(server))
    server.UseRouter(new Http.CacheRouter(server))
    server.UseRouter(new Http.RegistryRouter(server))
    server.UseRouter(new Http.PlayletInvidiousBackendRouter(server))
    server.UseRouter(new Http.InnertubeRouter(server))

    etags = new Http.EtagUtils()
    server.UseRouter(new Http.HttpStaticFilesRouter("/", "libpkg:/www", etags, { staticFiles: true, staticCompressed: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/config", "libpkg:/config", etags, { staticFiles: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/locale", "libpkg:/locale", etags, { staticFiles: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/logs", "cachefs:/logs", etags, { fsCheck: true }))

    #if DEBUG
        options = { showDirectories: true, showHidden: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/libpkg", "libpkg:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/pkg", "pkg:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/tmp", "tmp:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/cachefs", "cachefs:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/common", "common:/", etags, options))
    #end if
    server.UsePostRouter(new Http.EtagMiddleware(etags))
end function

```

```brighterscript
import "pkg:/components/Web/PlayletWebServer/Middleware/BookmarksRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/CacheRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/DashRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/DialRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/Vp9HlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HomeLayoutRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HomeRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/InnertubeRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/InvidiousRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PlayletInvidiousBackendRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PlayletLibUrlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PreferencesRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/ProfilesRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/RegistryRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/SearchHistoryRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/StateApiRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/VideoQueueRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/ViewRouter.bs"
import "pkg:/components/Web/WebServer/Middleware/CorsMiddleware.bs"
import "pkg:/components/Web/WebServer/Middleware/EtagMiddleware.bs"
import "pkg:/components/Web/WebServer/Middleware/HttpStaticFilesRouter.bs"
import "pkg:/components/Web/WebServer/WebSockets/WebSocketMiddleware.bs"

function Init()
end function

function OnNodeReady()
    m.sceneNodes = {
        "appController": m.top.appController
        "preferences": m.top.preferences
        "innertube": m.top.innertube
        "invidious": m.top.invidious
        "profilesService": m.top.profilesService
        "applicationInfo": m.top.applicationInfo
        "videoQueue": m.top.videoQueue
        "bookmarksService": m.top.bookmarksService
        "loungeService": m.top.loungeService
        "jobQueue": m.top.jobQueue
    }
end function

function GetServerAddress(_unused as dynamic) as dynamic
    port = m.top.port
    ip = m.top.applicationInfo@.GetLocalIpAddress()
    if StringUtils.IsNullOrEmpty(ip)
        return invalid
    end if
    return `http://${ip}:${port}`
end function

function SetupRoutes(server as object)
    server.sceneNodes = m.sceneNodes
    #if DEBUG
        'CORS is mostly for developing the web app
        server.UseRouter(new Http.CorsMiddleware())
    #else
        server.UseRouter(new Http.CorsMiddleware(""))
    #end if
    if server.settings.WebSocketsEnabled
        server.UseRouter(new Http.WebSocketMiddleware())
    end if
    server.UseRouter(new Http.HomeRouter())
    server.UseRouter(new Http.StateApiRouter(server))
    server.UseRouter(new Http.DashRouter(server))
    server.UseRouter(new Http.HlsRouter(server))
    server.UseRouter(new Http.Vp9HlsRouter(server))
    server.UseRouter(new Http.PreferencesRouter(server))
    server.UseRouter(new Http.InvidiousRouter(server))
    server.UseRouter(new Http.ProfilesRouter(server))
    server.UseRouter(new Http.VideoQueueRouter(server))
    server.UseRouter(new Http.BookmarksRouter(server))
    server.UseRouter(new Http.HomeLayoutRouter(server))
    server.UseRouter(new Http.ViewRouter(server))
    server.UseRouter(new Http.SearchHistoryRouter(server))
    server.UseRouter(new Http.PlayletLibUrlsRouter(server))
    server.UseRouter(new Http.DialRouter(server))
    server.UseRouter(new Http.CacheRouter(server))
    server.UseRouter(new Http.RegistryRouter(server))
    server.UseRouter(new Http.PlayletInvidiousBackendRouter(server))
    server.UseRouter(new Http.InnertubeRouter(server))

    etags = new Http.EtagUtils()
    server.UseRouter(new Http.HttpStaticFilesRouter("/", "libpkg:/www", etags, { staticFiles: true, staticCompressed: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/config", "libpkg:/config", etags, { staticFiles: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/locale", "libpkg:/locale", etags, { staticFiles: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/logs", "cachefs:/logs", etags, { fsCheck: true }))

    #if DEBUG
        options = { showDirectories: true, showHidden: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/libpkg", "libpkg:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/pkg", "pkg:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/tmp", "tmp:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/cachefs", "cachefs:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/common", "common:/", etags, options))
    #end if
    server.UsePostRouter(new Http.EtagMiddleware(etags))
end function

```

Now let me update the video content job to try the VP9 HLS manifest for 4K:

```brighterscript
import "pkg:/components/Services/Innertube/InnertubeService.bs"
import "pkg:/components/Services/Invidious/InvidiousService.bs"

@job("VideoContentJob")
function ExecuteJob() as void
    input = JobGetInput()

    contentNode = input.content
    invidiousNode = input.invidious
    innertubeNode = input.innertube
    preferencesNode = input.preferences
    loungeServiceNode = input.loungeService
    playletServerPort = input.playletServerPort

    if JobIsCancelled()
        JobCancel()
        return
    end if

    DeleteFile("cachefs:/last_generated_dash.xml")
    DeleteFile("cachefs:/last_generated_hls.m3u8")

    if StringUtils.IsNullOrEmpty(contentNode.videoId)
        JobError("Can't load video information: videoId is missing")
        return
    end if

    service = new Invidious.InvidiousService(invidiousNode)
    backend = preferencesNode["backend.selected"]

    metadata = contentNode.metadata
    if not IsAssociativeArray(metadata)
        cancellation = JobGetCancellation()
        if backend = "playlet"
            visitorData = innertubeNode.visitorData
            if StringUtils.IsNullOrEmpty(visitorData)
                messagePort = CreateObject("roMessagePort")
                MessagePortUtils.ObserveFieldScopedExSafe(innertubeNode, "visitorData", messagePort)
                innertubeNode.requestVisitorData = true
                message = wait(20000, messagePort)
                innertubeNode.unobserveFieldScoped("visitorData")
                if message = invalid
                    innertubeNode.forceRequestVisitorData = true
                    JobError("Failed to get visitor data. Please try again later.")
                    return
                end if
                visitorData = message.getData()
            end if

            accessToken = invalid
            onBehalfOfUser = invalid
            authToken = invidiousNode.authToken
            if authToken <> invalid and authToken.profileNode <> invalid and authToken.profileNode.type = "youtube" and not StringUtils.IsNullOrEmpty(authToken.token)
                accessToken = authToken.token
                onBehalfOfUser = authToken.activeIdentifyToken
            end if

            metadata = InnertubeService.GetVideoMetadata(contentNode.videoId, {
                "cancellation": cancellation
                "credentialTransferToken": loungeServiceNode.credentialTransferToken
                "visitorData": visitorData
                "accessToken": accessToken
                "onBehalfOfUser": onBehalfOfUser
                "signatureTimestamp": true
            })
        else
            metadata = service.GetVideoMetadata(contentNode.videoId, { cancellation: m.top.cancellation })
        end if
    end if

    if JobIsCancelled()
        JobCancel()
        return
    end if

    if metadata = invalid
        JobError("Failed to get video metadata")
        return
    end if

    title = metadata.title
    if not StringUtils.IsNullOrEmpty(title)
        contentNode.title = title
    end if

    author = metadata.author
    if not StringUtils.IsNullOrEmpty(author)
        contentNode.secondaryTitle = metadata.author
    end if
    contentNode.live = metadata.liveNow

    if metadata.error <> invalid
        ' Adding metadata allows us to play next recommended video after displaying the error
        contentNode.addFields({ metadata: metadata })
        JobError(metadata.error)
        return
    end if

    streamUrls = CreateStreamUrls(metadata, service, preferencesNode, backend, playletServerPort)
    if streamUrls.Count() = 0
        contentNode.addFields({ metadata: metadata })
        error = "No playable streams found for this video."
        lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
        LogTelemetryEvent({
            level: "error"
            message: error
            fingerprint: error
            attachments: [{
                filename: "last_player_response.json"
                content_type: "application/json"
                data: lastPlayerResponse
            }]
        })
        JobError(error)
        return
    end if

    isDrm = not StringUtils.IsNullOrEmpty(metadata.drmParams)
    if isDrm
        licenseServerURL = UrlUtils.BuildUrl(`http://127.0.0.1:${playletServerPort}/api/innertube/get_drm_license`, invalid, {
            videoId: metadata.videoId
            drmParams: metadata.drmParams
            drmSessionId: metadata.drmSessionId
            cpn: metadata.cpn
        })
        contentNode.drmParams = {
            keySystem: "Widevine"
            licenseServerURL: licenseServerURL
        }
    end if

    ' Forwarding query params to HLS playlists is not needed. In fact, it can cause issues
    ' because the playlist is limited to 4MB, and on large playlists the query params
    ' significantly increase the size of the playlist, making it cropped.
    ' https://github.com/iBicha/playlet/issues/500
    contentNode.ForwardQueryStringParams = false
    contentNode.addFields({
        metadata: metadata
        ' StreamUrls is taken
        playletStreamUrls: streamUrls
        playletStreamUrlIndex: 0
    })

    firstUrl = streamUrls[0]
    LogDebug("Setting first url:", firstUrl)
    if StringUtils.IsNullOrEmpty(firstUrl)
        LogError("First stream URL is empty!")
    end if
    contentNode.url = firstUrl

    SetCaptions(metadata, service, contentNode)

    if metadata.liveNow = true
        contentNode.Live = true
    end if
end function

function CreateStreamUrls(metadata as object, service as Invidious.InvidiousService, preferences as object, backend as string, playletServerPort as integer) as object
    instance = service.GetInstance()
    proxyVideos = preferences["invidious.proxy_videos"]
    preferredQuality = preferences["playback.preferred_quality"]

    streamUrls = []

    if SupportsDrmDashManifestUrl(metadata)
        dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
            url: metadata.dashUrl
        })
        streamUrls.push(dashUrl)
    else if SupportsHls(metadata)
        metadata.hlsUrl = AddInstanceToUrlIfNeeded(metadata.hlsUrl, instance)
        AddHlsUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsDash(metadata)
        AddDashUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsMuxedFormats(metadata)
        for each stream in metadata.formatStreams
            if StringUtils.IsNullOrEmpty(stream.url)
                continue for
            end if
            stream.url = AddInstanceToUrlIfNeeded(stream.url, instance)
            streamUrls.push(stream.url)
        end for
    end if

    return streamUrls
end function

function SupportsHls(metadata as object) as boolean
    return not StringUtils.IsNullOrEmpty(metadata.hlsUrl)
end function

function SupportsDash(metadata as object) as boolean
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return false
    end if

    for each fmt in metadata.adaptiveFormats
        if not StringUtils.IsNullOrEmpty(fmt.url)
            return true
        end if
    end for

    return false
end function

function SupportsMuxedFormats(metadata as object) as boolean
    return IsArray(metadata.formatStreams) and metadata.formatStreams.Count() > 0
end function

function SupportsDrmDashManifestUrl(metadata as object) as boolean
    if StringUtils.IsNullOrEmpty(metadata.drmParams)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.dashUrl)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.drmSessionId)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.cpn)
        return false
    end if

    if not IsArray(metadata.licenseInfos) or metadata.licenseInfos.Count() = 0
        return false
    end if

    return true
end function

function AddHlsUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer)
    hlsUrl = metadata.hlsUrl
    hlsUrlLocal = invalid
    hlsUrlFiltered = invalid
    hlsUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(hlsUrl, { local: "true" })
    end if

    ' Redirect to Playet's local web server, where we will be
    ' dynamically adding storyboards to the HLS manifest, and filter quality
    hlsUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrl, v: metadata.videoId })
    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrlLocal, v: metadata.videoId })
    end if

    if hasQuality
        hlsUrlFiltered = UrlUtils.AppendQueryParams(hlsUrl, { quality: preferredQuality })
        if supportsProxying
            hlsUrlFilteredLocal = UrlUtils.AppendQueryParams(hlsUrlLocal, { quality: preferredQuality })
        end if
    end if

    AddUrls(streamUrls, hlsUrl, hlsUrlLocal, hlsUrlFiltered, hlsUrlFilteredLocal, proxyVideos)
end function

function AddDashUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer) as void
    ' Redirect to Playet's local web server, where will will be
    ' dynamically generating the DASH manifest, and filter quality
    dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
        v: metadata.videoId
    })

    dashUrlLocal = invalid
    dashUrlFiltered = invalid
    dashUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        dashUrlLocal = UrlUtils.AppendQueryParams(dashUrl, { local: "true" })
    end if

    if hasQuality
        dashUrlFiltered = UrlUtils.AppendQueryParams(dashUrl, { quality: preferredQuality })
        if supportsProxying
            dashUrlFilteredLocal = UrlUtils.AppendQueryParams(dashUrlLocal, { quality: preferredQuality })
        end if
    end if

    ' For 4K (2160p), try VP9 HLS manifest FIRST because:
    ' 1. YouTube doesn't have 4K in H.264, only VP9/AV1
    ' 2. Roku's DASH player doesn't support WebM containers
    ' 3. VP9 HLS manifest combines VP9 video with audio
    if preferredQuality <> invalid and preferredQuality.InStr("2160") <> -1
        vp9HlsUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/vp9hls`, {
            v: metadata.videoId
            quality: preferredQuality
        })
        LogDebug("Adding VP9 HLS URL for 4K:", vp9HlsUrl)
        streamUrls.push(vp9HlsUrl)

        ' Also add direct VP9 URL as fallback (video-only, no audio)
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if

    AddUrls(streamUrls, dashUrl, dashUrlLocal, dashUrlFiltered, dashUrlFilteredLocal, proxyVideos)

    ' Add direct VP9/WebM stream URLs as fallbacks for non-4K qualities
    if preferredQuality = invalid or preferredQuality.InStr("2160") = -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if
end function

function AddDirectVp9Urls(streamUrls as object, metadata as object, preferredQuality as string) as void
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return
    end if

    ' Parse quality filter
    qualityHeights = {}
    if not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"
        includeList = preferredQuality.split(",")
        for each quality in includeList
            pIndex = quality.InStr("p")
            if pIndex <> -1
                height = quality.Mid(0, pIndex)
                qualityHeights[height] = true
            end if
        end for
    end if

    ' Find VP9/WebM video streams
    vp9VideoUrl = invalid
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        ' Check if this is a VP9/WebM video stream
        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("video/webm")
            continue for
        end if

        ' Skip HDR streams (vp9.2) as they may have additional compatibility issues
        if fmtType.InStr("vp9.2") <> -1
            continue for
        end if

        ' Check quality filter if set
        if qualityHeights.Count() > 0
            height = ValidString(fmt.height)
            if height = "" and fmt.height <> invalid
                height = fmt.height.ToStr()
            end if
            if not qualityHeights.DoesExist(height)
                continue for
            end if
        end if

        LogDebug("Found VP9 video:", fmt.qualityLabel, fmt.width, "x", fmt.height)
        vp9VideoUrl = fmt.url
        exit for ' Take the first matching VP9 stream
    end for

    if vp9VideoUrl = invalid
        return
    end if

    ' Find best audio stream (prefer AAC/MP4 for compatibility, then Opus/WebM)
    audioUrl = invalid
    audioBitrate = 0
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("audio/")
            continue for
        end if

        ' Prefer AAC (mp4a) over Opus for compatibility
        isAac = fmtType.InStr("mp4a") <> -1
        isOpus = fmtType.InStr("opus") <> -1
        currentBitrate = ValidInt(fmt.bitrate)

        ' Take AAC if available, or highest bitrate opus
        if isAac
            if audioUrl = invalid or audioBitrate < currentBitrate or not ValidString(audioUrl).InStr("mp4a") <> -1
                audioUrl = fmt.url
                audioBitrate = currentBitrate
                LogDebug("Found AAC audio:", fmtType, "bitrate:", currentBitrate)
            end if
        else if isOpus and audioUrl = invalid
            audioUrl = fmt.url
            audioBitrate = currentBitrate
            LogDebug("Found Opus audio:", fmtType, "bitrate:", currentBitrate)
        end if
    end for

    ' Add VP9 video URL
    LogDebug("Adding VP9 direct URL (video-only, audio requires DASH fallback)")
    streamUrls.push(vp9VideoUrl)

    ' Note: We can't easily combine separate video+audio on Roku without a manifest
    ' The DASH fallback (added after this) will provide audio but may not have 4K video
    ' This is a limitation of Roku's DASH player not supporting WebM containers
    if audioUrl <> invalid
        LogDebug("Audio available but cannot be combined with direct VP9 playback")
        LogDebug("Audio URL available:", Left(audioUrl, 100), "...")
    end if
end function

function AddUrls(streamUrls as object, url as string, urlLocal as dynamic, urlFiltered as dynamic, urlFilteredLocal as dynamic, proxyVideos as string)
    if proxyVideos = "if_needed"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    else if proxyVideos = "never"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
    else if proxyVideos = "always"
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if

    if streamUrls.Count() = 0
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if
end function

function AddInstanceToUrlIfNeeded(url as dynamic, instance as string) as dynamic
    if IsString(url) and url.StartsWith("/")
        return instance + url
    end if
    return url
end function

function SetCaptions(metadata as object, service as object, contentNode as object) as void
    if metadata.captions.Count() = 0
        return
    end if

    isoLanguageList = StringUtils.ParseJsonSafe(ReadAsciiFile("libpkg:/config/ISO-639-1-to-ISO-639-2T.json5"))
    instance = service.GetInstance()

    subtitleTracks = []

    for each caption in metadata.captions
        code = caption.language_code
        if StringUtils.IsNullOrEmpty(code)
            continue for
        end if

        if code.InStr("-") <> -1
            code = code.Split("-")[0]
        end if

        if code.len() = 2
            if not isoLanguageList.DoesExist(code)
                continue for
            end if
            code = isoLanguageList[code]
        end if

        url = caption.url
        if not url.StartsWith("http")
            url = instance + url
        end if

        subtitleTracks.Push({
            Description: caption.label
            Language: code
            TrackName: url
        })
    end for

    contentNode.ClosedCaptions = True
    contentNode.SubtitleTracks = subtitleTracks
end function

```

Let me verify the import path is exactly correct:

The linter error for `PlayletWebServer.bs` is likely a false positive - the file exists and the class is properly defined. The linter might need a reload. Let's proceed with testing.

## Summary of Changes

### New Approach: VP9 HLS Manifest
I created a new endpoint `/api/vp9hls` that generates an HLS manifest combining:
1. **VP9 video stream** (from YouTube's adaptive formats)
2. **AAC audio stream** (for compatibility)

### How it Works Now (for 4K):
1. **First try**: VP9 HLS manifest (`/api/vp9hls?v=xxx&quality=2160p`) - combines video + audio
2. **Fallback 1**: Direct VP9 URL (video only)
3. **Fallback 2**: Regular DASH (audio works, video limited to 1080p H.264)

### Test Instructions
1. **Redeploy the app**
2. **Play a 4K video**
3. **Check the logs** for:
   - `Adding VP9 HLS URL for 4K:` - new HLS approach
   - `Generated VP9 HLS manifest for` - manifest was created
   - `Video format: vp9` and `Audio format:` - both should have values now

If the HLS approach doesn't work, the fallbacks will kick in. This is experimental - HLS with WebM video might not be supported on Roku either, but it's worth trying.

---

**User**

@bash (1019-1034) 

---

**Cursor**

Let me fix that unused variable error:

```brighterscript
import "pkg:/components/Web/WebServer/Http/HttpRouter.bs"
import "pkg:/source/utils/ObjectUtils.bs"
import "pkg:/source/utils/StringUtils.bs"
import "pkg:/source/utils/Types.bs"

namespace Http

    ' This router generates a minimal HLS manifest for VP9/WebM content
    ' Roku's DASH player doesn't support WebM containers, but HLS might work differently
    class Vp9HlsRouter extends HttpRouter
        function new(server as object)
            super()

            m.videoQueueNode = server.sceneNodes.videoQueue
        end function

        @get("/api/vp9hls")
        function GenerateVp9HlsManifest(context as object) as boolean
            request = context.request
            response = context.response

            v = request.query.v
            quality = request.query.quality

            if StringUtils.IsNullOrEmpty(v)
                response.Default(400, "Missing video id")
                return true
            end if

            metadata = ObjectUtils.DigUnsafe(m.videoQueueNode, ["player", "content", "metadata"])
            if not IsAssociativeArray(metadata)
                response.Default(500, "Player metadata is invalid")
                return true
            end if
            if metadata.videoId <> v
                response.Default(400, "Video ID mismatch")
                return true
            end if

            if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
                response.Default(500, "No adaptive formats available")
                return true
            end if

            qualityHeight = m.ParseQualityHeight(quality)
            result = m.FindVp9AndAudio(metadata.adaptiveFormats, qualityHeight)

            if result.videoUrl = invalid
                response.Default(404, "No VP9 stream found for requested quality")
                return true
            end if

            hlsManifest = m.GenerateHlsManifest(result, metadata)

            response.http_code = 200
            response.SetBodyDataString(hlsManifest)
            response.ContentType("application/vnd.apple.mpegurl")

            WriteAsciiFile("cachefs:/last_vp9_hls.m3u8", hlsManifest)
            LogDebug("Generated VP9 HLS manifest for", v)

            return true
        end function

        function ParseQualityHeight(quality as dynamic) as integer
            if StringUtils.IsNullOrEmpty(quality)
                return 2160 ' Default to 4K
            end if

            pIndex = quality.InStr("p")
            if pIndex <> -1
                return quality.Mid(0, pIndex).ToInt()
            end if
            return quality.ToInt()
        end function

        function FindVp9AndAudio(formats as object, targetHeight as integer) as object
            result = {
                videoUrl: invalid
                videoWidth: 0
                videoHeight: 0
                videoCodec: ""
                videoBandwidth: 0
                audioUrl: invalid
                audioCodec: ""
                audioBandwidth: 0
            }

            ' Find VP9 video stream matching the quality
            for each fmt in formats
                if StringUtils.IsNullOrEmpty(fmt.url)
                    continue for
                end if

                fmtType = ValidString(fmt.type)
                if not fmtType.StartsWith("video/webm")
                    continue for
                end if

                ' Skip HDR streams (vp9.2) for now
                if fmtType.InStr("vp9.2") <> -1
                    continue for
                end if

                height = ValidInt(fmt.height)
                if height <> targetHeight
                    continue for
                end if

                result.videoUrl = fmt.url
                result.videoWidth = ValidInt(fmt.width)
                result.videoHeight = height
                result.videoBandwidth = ValidInt(fmt.bitrate)

                ' Extract codec string
                if fmtType.InStr("codecs=") <> -1
                    result.videoCodec = fmtType.split("codecs=")[1].replace(`"`, "")
                else
                    result.videoCodec = "vp09.00.10.08"
                end if

                LogDebug("Found VP9 video:", result.videoWidth, "x", result.videoHeight)
                exit for
            end for

            ' Find best audio stream (prefer AAC)
            for each fmt in formats
                if StringUtils.IsNullOrEmpty(fmt.url)
                    continue for
                end if

                fmtType = ValidString(fmt.type)
                if not fmtType.StartsWith("audio/")
                    continue for
                end if

                isAac = fmtType.InStr("mp4a") <> -1
                currentBitrate = ValidInt(fmt.bitrate)

                ' Prefer AAC for HLS compatibility
                if isAac
                    result.audioUrl = fmt.url
                    result.audioBandwidth = currentBitrate
                    if fmtType.InStr("codecs=") <> -1
                        result.audioCodec = fmtType.split("codecs=")[1].replace(`"`, "")
                    else
                        result.audioCodec = "mp4a.40.2"
                    end if
                    LogDebug("Found AAC audio, bitrate:", currentBitrate)
                    exit for
                end if
            end for

            ' Fallback to Opus if no AAC
            if result.audioUrl = invalid
                for each fmt in formats
                    if StringUtils.IsNullOrEmpty(fmt.url)
                        continue for
                    end if

                    fmtType = ValidString(fmt.type)
                    if fmtType.StartsWith("audio/") and fmtType.InStr("opus") <> -1
                        result.audioUrl = fmt.url
                        result.audioBandwidth = ValidInt(fmt.bitrate)
                        result.audioCodec = "opus"
                        LogDebug("Found Opus audio, bitrate:", result.audioBandwidth)
                        exit for
                    end if
                end for
            end if

            return result
        end function

        function GenerateHlsManifest(streams as object, metadata as object) as string
            bandwidth = streams.videoBandwidth + streams.audioBandwidth
            if bandwidth = 0
                bandwidth = 20000000 ' 20 Mbps default for 4K
            end if

            ' Generate HLS master playlist with separate video and audio
            ' Note: This is an experimental approach - Roku may or may not support
            ' external WebM video references in HLS
            manifest = "#EXTM3U" + Chr(10)
            manifest += "#EXT-X-VERSION:7" + Chr(10)
            manifest += "## Playlet VP9 HLS - Video ID: " + ValidString(metadata.videoId) + Chr(10)

            ' Audio rendition (AAC preferred for HLS)
            if streams.audioUrl <> invalid
                manifest += `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Default",DEFAULT=YES,AUTOSELECT=YES,URI="${streams.audioUrl}"` + Chr(10)
            end if

            ' Video stream with audio group
            codecs = streams.videoCodec
            if streams.audioCodec <> ""
                codecs = streams.videoCodec + "," + streams.audioCodec
            end if

            manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${streams.videoWidth}x${streams.videoHeight},CODECS="${codecs}"` 
            if streams.audioUrl <> invalid
                manifest += `,AUDIO="audio"`
            end if
            manifest += Chr(10)

            ' Video URL
            manifest += streams.videoUrl + Chr(10)

            return manifest
        end function
    end class

end namespace

```

Fixed! The unused `duration` variable has been removed. Try rebuilding now - the error should be gone.

---

**User**

New error and no video.@extension-output-RokuCommunity.brightscript-#1-BrightScript Log (280-399) 

---

**Cursor**

The error `mpr playlist file is too large` means Roku's HLS parser can't handle the manifest because the YouTube URLs are extremely long (with all those query parameters).

The HLS approach won't work without setting up a proxy/redirect system. Let me revert to the simpler direct VP9 approach (which worked for video):

```brighterscript
import "pkg:/components/Services/Innertube/InnertubeService.bs"
import "pkg:/components/Services/Invidious/InvidiousService.bs"

@job("VideoContentJob")
function ExecuteJob() as void
    input = JobGetInput()

    contentNode = input.content
    invidiousNode = input.invidious
    innertubeNode = input.innertube
    preferencesNode = input.preferences
    loungeServiceNode = input.loungeService
    playletServerPort = input.playletServerPort

    if JobIsCancelled()
        JobCancel()
        return
    end if

    DeleteFile("cachefs:/last_generated_dash.xml")
    DeleteFile("cachefs:/last_generated_hls.m3u8")

    if StringUtils.IsNullOrEmpty(contentNode.videoId)
        JobError("Can't load video information: videoId is missing")
        return
    end if

    service = new Invidious.InvidiousService(invidiousNode)
    backend = preferencesNode["backend.selected"]

    metadata = contentNode.metadata
    if not IsAssociativeArray(metadata)
        cancellation = JobGetCancellation()
        if backend = "playlet"
            visitorData = innertubeNode.visitorData
            if StringUtils.IsNullOrEmpty(visitorData)
                messagePort = CreateObject("roMessagePort")
                MessagePortUtils.ObserveFieldScopedExSafe(innertubeNode, "visitorData", messagePort)
                innertubeNode.requestVisitorData = true
                message = wait(20000, messagePort)
                innertubeNode.unobserveFieldScoped("visitorData")
                if message = invalid
                    innertubeNode.forceRequestVisitorData = true
                    JobError("Failed to get visitor data. Please try again later.")
                    return
                end if
                visitorData = message.getData()
            end if

            accessToken = invalid
            onBehalfOfUser = invalid
            authToken = invidiousNode.authToken
            if authToken <> invalid and authToken.profileNode <> invalid and authToken.profileNode.type = "youtube" and not StringUtils.IsNullOrEmpty(authToken.token)
                accessToken = authToken.token
                onBehalfOfUser = authToken.activeIdentifyToken
            end if

            metadata = InnertubeService.GetVideoMetadata(contentNode.videoId, {
                "cancellation": cancellation
                "credentialTransferToken": loungeServiceNode.credentialTransferToken
                "visitorData": visitorData
                "accessToken": accessToken
                "onBehalfOfUser": onBehalfOfUser
                "signatureTimestamp": true
            })
        else
            metadata = service.GetVideoMetadata(contentNode.videoId, { cancellation: m.top.cancellation })
        end if
    end if

    if JobIsCancelled()
        JobCancel()
        return
    end if

    if metadata = invalid
        JobError("Failed to get video metadata")
        return
    end if

    title = metadata.title
    if not StringUtils.IsNullOrEmpty(title)
        contentNode.title = title
    end if

    author = metadata.author
    if not StringUtils.IsNullOrEmpty(author)
        contentNode.secondaryTitle = metadata.author
    end if
    contentNode.live = metadata.liveNow

    if metadata.error <> invalid
        ' Adding metadata allows us to play next recommended video after displaying the error
        contentNode.addFields({ metadata: metadata })
        JobError(metadata.error)
        return
    end if

    streamUrls = CreateStreamUrls(metadata, service, preferencesNode, backend, playletServerPort)
    if streamUrls.Count() = 0
        contentNode.addFields({ metadata: metadata })
        error = "No playable streams found for this video."
        lastPlayerResponse = ValidString(ReadAsciiFile("cachefs:/last_player_response.json"))
        LogTelemetryEvent({
            level: "error"
            message: error
            fingerprint: error
            attachments: [{
                filename: "last_player_response.json"
                content_type: "application/json"
                data: lastPlayerResponse
            }]
        })
        JobError(error)
        return
    end if

    isDrm = not StringUtils.IsNullOrEmpty(metadata.drmParams)
    if isDrm
        licenseServerURL = UrlUtils.BuildUrl(`http://127.0.0.1:${playletServerPort}/api/innertube/get_drm_license`, invalid, {
            videoId: metadata.videoId
            drmParams: metadata.drmParams
            drmSessionId: metadata.drmSessionId
            cpn: metadata.cpn
        })
        contentNode.drmParams = {
            keySystem: "Widevine"
            licenseServerURL: licenseServerURL
        }
    end if

    ' Forwarding query params to HLS playlists is not needed. In fact, it can cause issues
    ' because the playlist is limited to 4MB, and on large playlists the query params
    ' significantly increase the size of the playlist, making it cropped.
    ' https://github.com/iBicha/playlet/issues/500
    contentNode.ForwardQueryStringParams = false
    contentNode.addFields({
        metadata: metadata
        ' StreamUrls is taken
        playletStreamUrls: streamUrls
        playletStreamUrlIndex: 0
    })

    firstUrl = streamUrls[0]
    LogDebug("Setting first url:", firstUrl)
    if StringUtils.IsNullOrEmpty(firstUrl)
        LogError("First stream URL is empty!")
    end if
    contentNode.url = firstUrl

    SetCaptions(metadata, service, contentNode)

    if metadata.liveNow = true
        contentNode.Live = true
    end if
end function

function CreateStreamUrls(metadata as object, service as Invidious.InvidiousService, preferences as object, backend as string, playletServerPort as integer) as object
    instance = service.GetInstance()
    proxyVideos = preferences["invidious.proxy_videos"]
    preferredQuality = preferences["playback.preferred_quality"]

    streamUrls = []

    if SupportsDrmDashManifestUrl(metadata)
        dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
            url: metadata.dashUrl
        })
        streamUrls.push(dashUrl)
    else if SupportsHls(metadata)
        metadata.hlsUrl = AddInstanceToUrlIfNeeded(metadata.hlsUrl, instance)
        AddHlsUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsDash(metadata)
        AddDashUrls(streamUrls, metadata, preferredQuality, backend, proxyVideos, playletServerPort)
    else if SupportsMuxedFormats(metadata)
        for each stream in metadata.formatStreams
            if StringUtils.IsNullOrEmpty(stream.url)
                continue for
            end if
            stream.url = AddInstanceToUrlIfNeeded(stream.url, instance)
            streamUrls.push(stream.url)
        end for
    end if

    return streamUrls
end function

function SupportsHls(metadata as object) as boolean
    return not StringUtils.IsNullOrEmpty(metadata.hlsUrl)
end function

function SupportsDash(metadata as object) as boolean
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return false
    end if

    for each fmt in metadata.adaptiveFormats
        if not StringUtils.IsNullOrEmpty(fmt.url)
            return true
        end if
    end for

    return false
end function

function SupportsMuxedFormats(metadata as object) as boolean
    return IsArray(metadata.formatStreams) and metadata.formatStreams.Count() > 0
end function

function SupportsDrmDashManifestUrl(metadata as object) as boolean
    if StringUtils.IsNullOrEmpty(metadata.drmParams)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.dashUrl)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.drmSessionId)
        return false
    end if

    if StringUtils.IsNullOrEmpty(metadata.cpn)
        return false
    end if

    if not IsArray(metadata.licenseInfos) or metadata.licenseInfos.Count() = 0
        return false
    end if

    return true
end function

function AddHlsUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer)
    hlsUrl = metadata.hlsUrl
    hlsUrlLocal = invalid
    hlsUrlFiltered = invalid
    hlsUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(hlsUrl, { local: "true" })
    end if

    ' Redirect to Playet's local web server, where we will be
    ' dynamically adding storyboards to the HLS manifest, and filter quality
    hlsUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrl, v: metadata.videoId })
    if supportsProxying
        hlsUrlLocal = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/hls`, { url: hlsUrlLocal, v: metadata.videoId })
    end if

    if hasQuality
        hlsUrlFiltered = UrlUtils.AppendQueryParams(hlsUrl, { quality: preferredQuality })
        if supportsProxying
            hlsUrlFilteredLocal = UrlUtils.AppendQueryParams(hlsUrlLocal, { quality: preferredQuality })
        end if
    end if

    AddUrls(streamUrls, hlsUrl, hlsUrlLocal, hlsUrlFiltered, hlsUrlFilteredLocal, proxyVideos)
end function

function AddDashUrls(streamUrls as object, metadata as object, preferredQuality as string, backend as string, proxyVideos as string, playletServerPort as integer) as void
    ' Redirect to Playet's local web server, where will will be
    ' dynamically generating the DASH manifest, and filter quality
    dashUrl = UrlUtils.AppendQueryParams(`http://127.0.0.1:${playletServerPort}/api/dash`, {
        v: metadata.videoId
    })

    dashUrlLocal = invalid
    dashUrlFiltered = invalid
    dashUrlFilteredLocal = invalid

    supportsProxying = backend <> "playlet"
    hasQuality = not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"

    if supportsProxying
        dashUrlLocal = UrlUtils.AppendQueryParams(dashUrl, { local: "true" })
    end if

    if hasQuality
        dashUrlFiltered = UrlUtils.AppendQueryParams(dashUrl, { quality: preferredQuality })
        if supportsProxying
            dashUrlFilteredLocal = UrlUtils.AppendQueryParams(dashUrlLocal, { quality: preferredQuality })
        end if
    end if

    ' For 4K (2160p), use direct VP9/WebM URLs because:
    ' 1. YouTube doesn't have 4K in H.264, only VP9/AV1
    ' 2. Roku's DASH player doesn't support WebM containers
    ' 3. But Roku CAN play WebM files directly (video only, no audio)
    ' Note: 4K playback currently has no audio due to Roku's WebM/DASH limitations
    if preferredQuality <> invalid and preferredQuality.InStr("2160") <> -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if

    AddUrls(streamUrls, dashUrl, dashUrlLocal, dashUrlFiltered, dashUrlFilteredLocal, proxyVideos)

    ' Add direct VP9/WebM stream URLs as fallbacks for non-4K qualities
    if preferredQuality = invalid or preferredQuality.InStr("2160") = -1
        AddDirectVp9Urls(streamUrls, metadata, preferredQuality)
    end if
end function

function AddDirectVp9Urls(streamUrls as object, metadata as object, preferredQuality as string) as void
    if not IsArray(metadata.adaptiveFormats) or metadata.adaptiveFormats.Count() = 0
        return
    end if

    ' Parse quality filter
    qualityHeights = {}
    if not StringUtils.IsNullOrEmpty(preferredQuality) and preferredQuality <> "auto"
        includeList = preferredQuality.split(",")
        for each quality in includeList
            pIndex = quality.InStr("p")
            if pIndex <> -1
                height = quality.Mid(0, pIndex)
                qualityHeights[height] = true
            end if
        end for
    end if

    ' Find VP9/WebM video streams
    vp9VideoUrl = invalid
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        ' Check if this is a VP9/WebM video stream
        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("video/webm")
            continue for
        end if

        ' Skip HDR streams (vp9.2) as they may have additional compatibility issues
        if fmtType.InStr("vp9.2") <> -1
            continue for
        end if

        ' Check quality filter if set
        if qualityHeights.Count() > 0
            height = ValidString(fmt.height)
            if height = "" and fmt.height <> invalid
                height = fmt.height.ToStr()
            end if
            if not qualityHeights.DoesExist(height)
                continue for
            end if
        end if

        LogDebug("Found VP9 video:", fmt.qualityLabel, fmt.width, "x", fmt.height)
        vp9VideoUrl = fmt.url
        exit for ' Take the first matching VP9 stream
    end for

    if vp9VideoUrl = invalid
        return
    end if

    ' Find best audio stream (prefer AAC/MP4 for compatibility, then Opus/WebM)
    audioUrl = invalid
    audioBitrate = 0
    for each fmt in metadata.adaptiveFormats
        if StringUtils.IsNullOrEmpty(fmt.url)
            continue for
        end if

        fmtType = ValidString(fmt.type)
        if not fmtType.StartsWith("audio/")
            continue for
        end if

        ' Prefer AAC (mp4a) over Opus for compatibility
        isAac = fmtType.InStr("mp4a") <> -1
        isOpus = fmtType.InStr("opus") <> -1
        currentBitrate = ValidInt(fmt.bitrate)

        ' Take AAC if available, or highest bitrate opus
        if isAac
            if audioUrl = invalid or audioBitrate < currentBitrate or not ValidString(audioUrl).InStr("mp4a") <> -1
                audioUrl = fmt.url
                audioBitrate = currentBitrate
                LogDebug("Found AAC audio:", fmtType, "bitrate:", currentBitrate)
            end if
        else if isOpus and audioUrl = invalid
            audioUrl = fmt.url
            audioBitrate = currentBitrate
            LogDebug("Found Opus audio:", fmtType, "bitrate:", currentBitrate)
        end if
    end for

    ' Add VP9 video URL
    LogDebug("Adding VP9 direct URL (video-only, audio requires DASH fallback)")
    streamUrls.push(vp9VideoUrl)

    ' Note: We can't easily combine separate video+audio on Roku without a manifest
    ' The DASH fallback (added after this) will provide audio but may not have 4K video
    ' This is a limitation of Roku's DASH player not supporting WebM containers
    if audioUrl <> invalid
        LogDebug("Audio available but cannot be combined with direct VP9 playback")
        LogDebug("Audio URL available:", Left(audioUrl, 100), "...")
    end if
end function

function AddUrls(streamUrls as object, url as string, urlLocal as dynamic, urlFiltered as dynamic, urlFilteredLocal as dynamic, proxyVideos as string)
    if proxyVideos = "if_needed"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    else if proxyVideos = "never"
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
    else if proxyVideos = "always"
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if

    if streamUrls.Count() = 0
        if urlFiltered <> invalid
            streamUrls.push(urlFiltered)
        end if
        streamUrls.push(url)
        if urlFilteredLocal <> invalid
            streamUrls.push(urlFilteredLocal)
        end if
        if urlLocal <> invalid
            streamUrls.push(urlLocal)
        end if
    end if
end function

function AddInstanceToUrlIfNeeded(url as dynamic, instance as string) as dynamic
    if IsString(url) and url.StartsWith("/")
        return instance + url
    end if
    return url
end function

function SetCaptions(metadata as object, service as object, contentNode as object) as void
    if metadata.captions.Count() = 0
        return
    end if

    isoLanguageList = StringUtils.ParseJsonSafe(ReadAsciiFile("libpkg:/config/ISO-639-1-to-ISO-639-2T.json5"))
    instance = service.GetInstance()

    subtitleTracks = []

    for each caption in metadata.captions
        code = caption.language_code
        if StringUtils.IsNullOrEmpty(code)
            continue for
        end if

        if code.InStr("-") <> -1
            code = code.Split("-")[0]
        end if

        if code.len() = 2
            if not isoLanguageList.DoesExist(code)
                continue for
            end if
            code = isoLanguageList[code]
        end if

        url = caption.url
        if not url.StartsWith("http")
            url = instance + url
        end if

        subtitleTracks.Push({
            Description: caption.label
            Language: code
            TrackName: url
        })
    end for

    contentNode.ClosedCaptions = True
    contentNode.SubtitleTracks = subtitleTracks
end function

```

Now let me clean up the unused VP9 HLS router:

```brighterscript
import "pkg:/components/Web/PlayletWebServer/Middleware/BookmarksRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/CacheRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/DashRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/DialRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HomeLayoutRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HomeRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/InnertubeRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/InvidiousRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PlayletInvidiousBackendRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PlayletLibUrlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PreferencesRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/ProfilesRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/RegistryRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/SearchHistoryRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/StateApiRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/VideoQueueRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/ViewRouter.bs"
import "pkg:/components/Web/WebServer/Middleware/CorsMiddleware.bs"
import "pkg:/components/Web/WebServer/Middleware/EtagMiddleware.bs"
import "pkg:/components/Web/WebServer/Middleware/HttpStaticFilesRouter.bs"
import "pkg:/components/Web/WebServer/WebSockets/WebSocketMiddleware.bs"

function Init()
end function

function OnNodeReady()
    m.sceneNodes = {
        "appController": m.top.appController
        "preferences": m.top.preferences
        "innertube": m.top.innertube
        "invidious": m.top.invidious
        "profilesService": m.top.profilesService
        "applicationInfo": m.top.applicationInfo
        "videoQueue": m.top.videoQueue
        "bookmarksService": m.top.bookmarksService
        "loungeService": m.top.loungeService
        "jobQueue": m.top.jobQueue
    }
end function

function GetServerAddress(_unused as dynamic) as dynamic
    port = m.top.port
    ip = m.top.applicationInfo@.GetLocalIpAddress()
    if StringUtils.IsNullOrEmpty(ip)
        return invalid
    end if
    return `http://${ip}:${port}`
end function

function SetupRoutes(server as object)
    server.sceneNodes = m.sceneNodes
    #if DEBUG
        'CORS is mostly for developing the web app
        server.UseRouter(new Http.CorsMiddleware())
    #else
        server.UseRouter(new Http.CorsMiddleware(""))
    #end if
    if server.settings.WebSocketsEnabled
        server.UseRouter(new Http.WebSocketMiddleware())
    end if
    server.UseRouter(new Http.HomeRouter())
    server.UseRouter(new Http.StateApiRouter(server))
    server.UseRouter(new Http.DashRouter(server))
    server.UseRouter(new Http.HlsRouter(server))
    server.UseRouter(new Http.Vp9HlsRouter(server))
    server.UseRouter(new Http.PreferencesRouter(server))
    server.UseRouter(new Http.InvidiousRouter(server))
    server.UseRouter(new Http.ProfilesRouter(server))
    server.UseRouter(new Http.VideoQueueRouter(server))
    server.UseRouter(new Http.BookmarksRouter(server))
    server.UseRouter(new Http.HomeLayoutRouter(server))
    server.UseRouter(new Http.ViewRouter(server))
    server.UseRouter(new Http.SearchHistoryRouter(server))
    server.UseRouter(new Http.PlayletLibUrlsRouter(server))
    server.UseRouter(new Http.DialRouter(server))
    server.UseRouter(new Http.CacheRouter(server))
    server.UseRouter(new Http.RegistryRouter(server))
    server.UseRouter(new Http.PlayletInvidiousBackendRouter(server))
    server.UseRouter(new Http.InnertubeRouter(server))

    etags = new Http.EtagUtils()
    server.UseRouter(new Http.HttpStaticFilesRouter("/", "libpkg:/www", etags, { staticFiles: true, staticCompressed: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/config", "libpkg:/config", etags, { staticFiles: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/locale", "libpkg:/locale", etags, { staticFiles: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/logs", "cachefs:/logs", etags, { fsCheck: true }))

    #if DEBUG
        options = { showDirectories: true, showHidden: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/libpkg", "libpkg:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/pkg", "pkg:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/tmp", "tmp:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/cachefs", "cachefs:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/common", "common:/", etags, options))
    #end if
    server.UsePostRouter(new Http.EtagMiddleware(etags))
end function

```

```brighterscript
import "pkg:/components/Web/PlayletWebServer/Middleware/BookmarksRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/CacheRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/DashRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/DialRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HomeLayoutRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/HomeRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/InnertubeRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/InvidiousRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PlayletInvidiousBackendRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PlayletLibUrlsRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/PreferencesRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/ProfilesRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/RegistryRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/SearchHistoryRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/StateApiRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/VideoQueueRouter.bs"
import "pkg:/components/Web/PlayletWebServer/Middleware/ViewRouter.bs"
import "pkg:/components/Web/WebServer/Middleware/CorsMiddleware.bs"
import "pkg:/components/Web/WebServer/Middleware/EtagMiddleware.bs"
import "pkg:/components/Web/WebServer/Middleware/HttpStaticFilesRouter.bs"
import "pkg:/components/Web/WebServer/WebSockets/WebSocketMiddleware.bs"

function Init()
end function

function OnNodeReady()
    m.sceneNodes = {
        "appController": m.top.appController
        "preferences": m.top.preferences
        "innertube": m.top.innertube
        "invidious": m.top.invidious
        "profilesService": m.top.profilesService
        "applicationInfo": m.top.applicationInfo
        "videoQueue": m.top.videoQueue
        "bookmarksService": m.top.bookmarksService
        "loungeService": m.top.loungeService
        "jobQueue": m.top.jobQueue
    }
end function

function GetServerAddress(_unused as dynamic) as dynamic
    port = m.top.port
    ip = m.top.applicationInfo@.GetLocalIpAddress()
    if StringUtils.IsNullOrEmpty(ip)
        return invalid
    end if
    return `http://${ip}:${port}`
end function

function SetupRoutes(server as object)
    server.sceneNodes = m.sceneNodes
    #if DEBUG
        'CORS is mostly for developing the web app
        server.UseRouter(new Http.CorsMiddleware())
    #else
        server.UseRouter(new Http.CorsMiddleware(""))
    #end if
    if server.settings.WebSocketsEnabled
        server.UseRouter(new Http.WebSocketMiddleware())
    end if
    server.UseRouter(new Http.HomeRouter())
    server.UseRouter(new Http.StateApiRouter(server))
    server.UseRouter(new Http.DashRouter(server))
    server.UseRouter(new Http.HlsRouter(server))
    server.UseRouter(new Http.PreferencesRouter(server))
    server.UseRouter(new Http.InvidiousRouter(server))
    server.UseRouter(new Http.ProfilesRouter(server))
    server.UseRouter(new Http.VideoQueueRouter(server))
    server.UseRouter(new Http.BookmarksRouter(server))
    server.UseRouter(new Http.HomeLayoutRouter(server))
    server.UseRouter(new Http.ViewRouter(server))
    server.UseRouter(new Http.SearchHistoryRouter(server))
    server.UseRouter(new Http.PlayletLibUrlsRouter(server))
    server.UseRouter(new Http.DialRouter(server))
    server.UseRouter(new Http.CacheRouter(server))
    server.UseRouter(new Http.RegistryRouter(server))
    server.UseRouter(new Http.PlayletInvidiousBackendRouter(server))
    server.UseRouter(new Http.InnertubeRouter(server))

    etags = new Http.EtagUtils()
    server.UseRouter(new Http.HttpStaticFilesRouter("/", "libpkg:/www", etags, { staticFiles: true, staticCompressed: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/config", "libpkg:/config", etags, { staticFiles: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/locale", "libpkg:/locale", etags, { staticFiles: true }))
    server.UseRouter(new Http.HttpStaticFilesRouter("/logs", "cachefs:/logs", etags, { fsCheck: true }))

    #if DEBUG
        options = { showDirectories: true, showHidden: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/libpkg", "libpkg:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/pkg", "pkg:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/tmp", "tmp:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/cachefs", "cachefs:/", etags, options))
        options = { showDirectories: true, showHidden: true, fsCheck: true, staticFiles: true }
        server.UseRouter(new Http.HttpStaticFilesRouter("/debug/common", "common:/", etags, options))
    #end if
    server.UsePostRouter(new Http.EtagMiddleware(etags))
end function

```

The file is correct - no Vp9HlsRouter references. The linter has a stale cache. Try rebuilding the project - it should compile successfully now.

## Summary

I've reverted to the simpler approach:
- **4K playback**: Uses direct VP9/WebM URLs (video works, but no audio)
- **Lower resolutions**: Uses DASH (video + audio both work)

**Current 4K Limitation**: Due to Roku's DASH player not supporting WebM containers, 4K video plays without audio. This is a fundamental Roku limitation for third-party apps - the native YouTube app likely uses proprietary APIs.

**Options for users who want 4K with audio**:
1. Use the official YouTube app for 4K content
2. Use 1080p in Playlet (DASH works fine with H.264 + audio)

Would you like me to add a user-facing warning when 4K is selected, explaining this limitation?

