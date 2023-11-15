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

  import RemoteButton from "./RemoteControl/RemoteButton.svelte";

  export let visibility: boolean;

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
</script>

<div class={visibility ? "" : "hidden"}>
  <div class="flex flex-col items-center justify-center p-6">
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.back} icon={ArrowBackIcon} />
      <RemoteButton key={BUTTONS.home} icon={HomeIcon} />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.up} icon={ArrowUpIcon} />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.left} icon={ArrowLeftIcon} />
      <RemoteButton key={BUTTONS.select} icon={OkIcon} />
      <RemoteButton key={BUTTONS.right} icon={ArrowRightIcon} />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.down} icon={ArrowDownIcon} />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.instantReplay} icon={InstantReplayIcon} />
      <RemoteButton key={BUTTONS.info} icon={OptionsIcon} />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.rev} icon={FastBackwardIcon} />
      <RemoteButton key={BUTTONS.play} icon={PlayIcon} />
      <RemoteButton key={BUTTONS.fwd} icon={FastForwardIcon} />
    </div>
    <div class="flex space-x-2 m-2">
      <RemoteButton key={BUTTONS.volumeMute} icon={VolumeMuteIcon} />
      <RemoteButton key={BUTTONS.volumeDown} icon={VolumeDownIcon} />
      <RemoteButton key={BUTTONS.volumeUp} icon={VolumeUpIcon} />
    </div>
  </div>
</div>
