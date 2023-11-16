<script lang="ts">
  import { ExternalControlProtocol } from "lib/Api/ExternalControlProtocol";

  import HomeIcon from "assets/remote-control/home.svg.svelte";
  import ArrowBackIcon from "assets/remote-control/arrow-back.svg.svelte";
  import ArrowUpIcon from "assets/remote-control/arrow-up.svg.svelte";
  import ArrowDownIcon from "assets/remote-control/arrow-down.svg.svelte";
  import ArrowLeftIcon from "assets/remote-control/arrow-left.svg.svelte";
  import ArrowRightIcon from "assets/remote-control/arrow-right.svg.svelte";
  import OkIcon from "assets/remote-control/ok.svelte";
  import InstantReplayIcon from "assets/remote-control/instant-replay.svg.svelte";
  import OptionsIcon from "assets/remote-control/options.svg.svelte";
  import FastForwardIcon from "assets/remote-control/fast-forward.svg.svelte";
  import FastBackwardIcon from "assets/remote-control/fast-backward.svg.svelte";
  import PlayIcon from "assets/remote-control/play.svg.svelte";
  import VolumeDownIcon from "assets/remote-control/volume-down.svg.svelte";
  import VolumeMuteIcon from "assets/remote-control/volume-mute.svg.svelte";
  import VolumeUpIcon from "assets/remote-control/volume-up.svg.svelte";
  import PowerIcon from "assets/remote-control/power.svg.svelte";

  import RemoteButton from "./RemoteControl/RemoteButton.svelte";
  import { onDestroy, onMount } from "svelte";

  export let visibility: boolean;
  let screen;

  const BUTTONS = {
    home: "Home",
    rev: "Rev",
    fwd: "Fwd",
    play: "Play",
    select: "Select",
    left: "Left",
    right: "Right",
    down: "Down",
    up: "Up",
    back: "Back",
    instantReplay: "InstantReplay",
    info: "Info",
    backspace: "Backspace",
    search: "Search",
    enter: "Enter",
    volumeDown: "VolumeDown",
    volumeMute: "VolumeMute",
    volumeUp: "VolumeUp",
    powerOff: "PowerOff",
  };

  const KEYBOARD_BUTTONS = {
    ArrowRight: BUTTONS.right,
    ArrowLeft: BUTTONS.left,
    ArrowUp: BUTTONS.up,
    ArrowDown: BUTTONS.down,
    Enter: BUTTONS.select,
    Backspace: BUTTONS.backspace,
    Escape: BUTTONS.back,
    "*": BUTTONS.info,
  };

  onMount(() => {
    screen.addEventListener("keydown", onKeyDown);
    screen.addEventListener("keyup", onKeyUp);
    // TODO:P1 support navigator.mediaSession
    // media buttons, such as play/pause, next, and previous track.
    // metadata, like title, artist, album, artwork
  });

  onDestroy(() => {
    screen.removeEventListener("keydown", onKeyDown);
    screen.removeEventListener("keyup", onKeyUp);
  });

  function onKeyDown(event) {
    if (!visibility) {
      return;
    }
    event.preventDefault();
    if (event.repeat) {
      return;
    }
    if (event.key in KEYBOARD_BUTTONS) {
      ExternalControlProtocol.pressKeyDown(KEYBOARD_BUTTONS[event.key]);
    } else {
      ExternalControlProtocol.pressKeyDown(
        "Lit_" + encodeURIComponent(event.key)
      );
    }
  }

  function onKeyUp(event) {
    if (!visibility) {
      return;
    }
    event.preventDefault();
    if (event.repeat) {
      return;
    }
    if (event.key in KEYBOARD_BUTTONS) {
      ExternalControlProtocol.pressKeyUp(KEYBOARD_BUTTONS[event.key]);
    } else {
      ExternalControlProtocol.pressKeyUp(
        "Lit_" + encodeURIComponent(event.key)
      );
    }
  }
</script>

<div bind:this={screen} tabindex="-1" class={visibility ? "" : "hidden"}>
  <div class="flex flex-col items-center justify-center p-6">
    <div class="flex space-x-2 m-2">
      <button
        on:click={() => {
          ExternalControlProtocol.pressKey(BUTTONS.powerOff);
        }}
        class="btn-primary rounded-full flex items-center justify-center bg-red-600 hover:bg-red-400 w-12 h-12 text-white"
      >
        <PowerIcon />
      </button>
    </div>

    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.back} icon={ArrowBackIcon} />
      <RemoteButton key={BUTTONS.home} icon={HomeIcon} />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.up} icon={ArrowUpIcon} small />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.left} icon={ArrowLeftIcon} small />
      <RemoteButton key={BUTTONS.select} icon={OkIcon} small />
      <RemoteButton key={BUTTONS.right} icon={ArrowRightIcon} small />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.down} icon={ArrowDownIcon} small />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.instantReplay} icon={InstantReplayIcon} />
      <RemoteButton key={BUTTONS.info} icon={OptionsIcon} />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.rev} icon={FastBackwardIcon} small />
      <RemoteButton key={BUTTONS.play} icon={PlayIcon} small />
      <RemoteButton key={BUTTONS.fwd} icon={FastForwardIcon} small />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.volumeMute} icon={VolumeMuteIcon} small />
      <RemoteButton key={BUTTONS.volumeDown} icon={VolumeDownIcon} small />
      <RemoteButton key={BUTTONS.volumeUp} icon={VolumeUpIcon} small />
    </div>
  </div>
</div>
