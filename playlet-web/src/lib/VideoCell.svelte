<script lang="ts">
  import { PlayletApi } from "./PlayletApi";
  import { playletStateStore } from "./Stores";
  import VideoStartAt from "./VideoStartAt.svelte";

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

  let modal;
  let tvName = "Roku TV";
  let invidiousInstance;
  let videoStartAtChecked;
  let videoStartAtTimestamp;

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
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

  function getThumbnailUrl(quality: string = "medium") {
    if (!videoThumbnails || videoThumbnails.length === 0) {
      return "";
    }
    const videoThumbnail =
      videoThumbnails.find((thumbnail) => thumbnail.quality === quality) ||
      videoThumbnails[0];
    let url = videoThumbnail.url;
    if (url.startsWith("/") && invidiousInstance) {
      url = invidiousInstance + url;
    }
    return url;
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

  function getFormattedTime(length) {
    const hours = Math.floor(length / 3600);
    const minutes = Math.floor((length / 60) % 60);
    const seconds = length % 60;

    const secondsString = seconds < 10 ? `0${seconds}` : seconds.toString();
    const minutesString =
      minutes < 10 && hours > 0 ? `0${minutes}` : minutes.toString();

    let formattedTime = minutesString + ":" + secondsString;

    if (hours > 0) {
      formattedTime = hours.toString() + ":" + formattedTime;
    }

    return formattedTime;
  }

  function isVideoLive() {
    if (liveNow) {
      return true;
    }
    return lengthSeconds === 0 && viewCount === 0;
  }

  async function playVideoOnTv() {
    await PlayletApi.playVideo(videoId, videoStartAtTimestamp, title, author);
  }

  async function queueVideoOnTv() {
    await PlayletApi.queueVideo(videoId, videoStartAtTimestamp, title, author);
  }

  function openInvidiousInNewTab() {
    let url = `${invidiousInstance}/watch?v=${videoId}`;
    if (videoStartAtChecked && videoStartAtTimestamp) {
      url += `&t=${videoStartAtTimestamp}`;
    }
    window.open(url);
  }
</script>

<button class="w-80 p-2" on:click={modal.showModal()}>
  <div class="card card-compact bg-base-100 shadow-xl border border-neutral">
    <figure class="relative">
      <img
        class="w-full rounded-box aspect-video object-cover"
        loading="lazy"
        width="320"
        height="180"
        src={getThumbnailUrl()}
        alt={title}
      />
      {#if isVideoLive()}
        <div
          class="absolute bottom-2 right-0 bg-red-500 text-white text-sm rounded-sm font-bold pt-1 pb-1 pr-2 pl-2"
        >
          LIVE
        </div>
      {:else if lengthSeconds}
        <div
          class="absolute bottom-2 right-0 bg-black/70 text-white text-sm rounded-sm pt-1 pb-1 pr-2 pl-2"
        >
          {getFormattedTime(lengthSeconds)}
        </div>
      {/if}
    </figure>
    <div class="card-body">
      <h3 class="card-title text-base line-clamp-2 min-h-12">{title}</h3>
      <div class="font-semibold">{author}</div>
      <div>{getViewCountDateText()}</div>
    </div>
  </div>
</button>
<!-- TODO:P2 a dialog for every video is very slow. Need to reuse the same one -->
<dialog bind:this={modal} id="modal_{videoId}" class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <h3 class="text-lg m-5">{title}</h3>
    <div class="flex flex-col">
      <VideoStartAt
        bind:checked={videoStartAtChecked}
        bind:timestamp={videoStartAtTimestamp}
        {lengthSeconds}
      />
      <button class="btn m-2" on:click={playVideoOnTv}>Play on {tvName}</button>
      <button class="btn m-2" on:click={queueVideoOnTv}
        >Queue on {tvName}
      </button>
      <button class="btn m-2" on:click={openInvidiousInNewTab}
        >Open in Invidious</button
      >
      <button class="btn m-2">Cancel</button>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
