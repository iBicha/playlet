<script lang="ts">
  import { playletStateStore } from "lib/Stores";
  import VideoCastDialog from "./VideoCastDialog.svelte";
  import VideoThumbnail from "./VideoThumbnail.svelte";
  import ChannelCastDialog from "./ChannelCastDialog.svelte";

  export let title: string | undefined = undefined;
  export let videoId: string | undefined = undefined;
  export let author: string | undefined = undefined;
  export let videoThumbnails: any[] | undefined = undefined;
  export let viewCount: number | undefined = undefined;
  export let publishedText: string | undefined = undefined;
  export let isUpcoming: boolean = undefined;
  export let premiereTimestamp: number | undefined = undefined;
  export let lengthSeconds: number = undefined;
  export let liveNow: boolean = undefined;

  // svelte-ignore unused-export-let
  export let type: string = undefined;
  // svelte-ignore unused-export-let
  export let authorId: string = undefined;
  // svelte-ignore unused-export-let
  export let authorUrl: string = undefined;
  // svelte-ignore unused-export-let
  export let authorVerified: boolean = undefined;
  // svelte-ignore unused-export-let
  export let description: string = undefined;
  // svelte-ignore unused-export-let
  export let descriptionHtml: string = undefined;
  // svelte-ignore unused-export-let
  export let viewCountText: string = undefined;
  // svelte-ignore unused-export-let
  export let published: number = undefined;
  // svelte-ignore unused-export-let
  export let premium: boolean = undefined;
  // svelte-ignore unused-export-let
  export let index: number = undefined;
  // svelte-ignore unused-export-let
  export let indexId: string = undefined;

  let videoModal;
  let channelModal;
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    invidiousInstance = value?.invidious?.current_instance;
  });

  function getViewCountDateText() {
    if (isUpcoming) {
      return `Premeres in ${getFormattedTimeLeft(premiereTimestamp)}`;
    }
    const pubText = publishedText || "";
    const viewCountText = formatViewCount(viewCount);

    if (pubText === "" && viewCountText === "") {
      return "";
    }

    return `${pubText} • ${viewCountText}`;
  }

  function getFormattedTimeLeft(unixTimestamp) {
    if (unixTimestamp === "invalid") {
      return "N/A";
    }

    const currentTime = Math.floor(Date.now() / 1000);
    let timeLeft = unixTimestamp - currentTime;
    if (timeLeft <= 0) {
      return "now";
    }

    if (timeLeft < 60) {
      let result = `${timeLeft} second`;
      if (timeLeft > 1) {
        result += "s";
      }
      return result;
    }

    timeLeft = timeLeft / 60.0;
    if (timeLeft < 60) {
      timeLeft = Math.floor(timeLeft);
      let result = `${timeLeft} minute`;
      if (timeLeft > 1) {
        result += "s";
      }
      return result;
    }

    timeLeft = timeLeft / 60.0;
    if (timeLeft < 24) {
      timeLeft = Math.floor(timeLeft);
      let result = `${timeLeft} hour`;
      if (timeLeft > 1) {
        result += "s";
      }
      return result;
    } else {
      timeLeft = timeLeft / 24.0;
      timeLeft = Math.floor(timeLeft);
      let result = `${timeLeft} day`;
      if (timeLeft > 1) {
        result += "s";
      }
      return result;
    }
  }

  function formatViewCount(viewCount) {
    if (isNaN(viewCount)) {
      return "";
    }
    if (viewCount < 1000) {
      return `${formatFloat(viewCount)} views`;
    }

    viewCount = viewCount / 1000;
    if (viewCount < 1000) {
      return `${formatFloat(viewCount)}K views`;
    }

    viewCount = viewCount / 1000;
    if (viewCount < 1000) {
      return `${formatFloat(viewCount)}M views`;
    }

    viewCount = viewCount / 1000;
    return `${formatFloat(viewCount)}B views`;
  }

  function formatFloat(X) {
    X = X * 10;
    X = X + 0.5;
    X = Math.floor(X);
    X = X / 10;
    return X;
  }
</script>

<button class="w-80 p-2" on:click={videoModal.show()}>
  <div class="card card-compact bg-base-100 shadow-xl border border-neutral">
    <VideoThumbnail
      bind:videoId
      bind:title
      bind:videoThumbnails
      bind:liveNow
      bind:isUpcoming
      bind:premiereTimestamp
      bind:lengthSeconds
      bind:viewCount
      bind:invidiousInstance
    />
    <div class="card-body">
      <h3 class="card-title text-base line-clamp-2 min-h-12">{title || ""}</h3>
      <button
        class="font-semibold link"
        on:click={(e) => {
          e.stopPropagation();
          channelModal.show();
        }}
      >
        {author || ""}
      </button>
      <div>{getViewCountDateText()}</div>
    </div>
  </div>
</button>
<VideoCastDialog
  bind:this={videoModal}
  bind:videoId
  bind:title
  bind:author
  bind:lengthSeconds
  bind:videoThumbnails
  bind:liveNow
  bind:isUpcoming
  bind:premiereTimestamp
  bind:viewCount
  videoStartAtChecked={false}
  videoStartAtTimestamp={0}
/>
<ChannelCastDialog bind:this={channelModal} bind:author bind:authorId />
