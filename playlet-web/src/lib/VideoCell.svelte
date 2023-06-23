<script lang="ts">
  import { PlayletApi } from "./PlayletApi";
  import { playletStateStore } from "./Stores";

  export let title: string | undefined = undefined;
  export let videoId: string | undefined = undefined;
  export let author: string | undefined = undefined;
  export let videoThumbnails: any[] | undefined = undefined;
  export let viewCount: number | undefined = undefined;
  export let publishedText: string | undefined = undefined;
  export let isUpcoming: boolean = undefined;
  export let premiereTimestamp: number | undefined = undefined;

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
  export let lengthSeconds: number = undefined;
  // svelte-ignore unused-export-let
  export let liveNow: boolean = undefined;
  // svelte-ignore unused-export-let
  export let premium: boolean = undefined;
  // svelte-ignore unused-export-let
  export let index: number = undefined;
  // svelte-ignore unused-export-let
  export let indexId: string = undefined;

  let modal;
  let tvName = "Roku TV";
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
    invidiousInstance = value?.invidious?.current_instance;
  });

  function getViewCountDateText() {
    if (isUpcoming) {
      return `Premeres in ${getFormattedTimeLeft(premiereTimestamp)}`;
    }
    const pubText = publishedText || '';
    const viewCountText = formatViewCount(viewCount);

    if (pubText === '' && viewCountText === '') {
      return '';
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
    return videoThumbnail.url;
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
    const minutes = Math.floor(length / 60).toString();
    const seconds = (length % 60);
    const secondsString = seconds < 10 ? `0${seconds}` : seconds.toString();
    return minutes + ":" + secondsString;
  }

  function isVideoLive() {
    if (liveNow) {
      return true;
    }
    return lengthSeconds === 0 && viewCount === 0;
  }

  async function playVideoOnTv() {
    await PlayletApi.playVideo(videoId);
  }

  function openInvidiousInNewTab() {
    window.open(`${invidiousInstance}/watch?v=${videoId}`)
  }
</script>

<button class="w-96" on:click="{modal.showModal()}">
  <div class="card bg-base-100 shadow-xl border border-neutral">
    <figure class="relative">
      <img class="w-full rounded-box" loading="lazy" width="320" height="180" src={getThumbnailUrl()} alt={title} />
      {#if isVideoLive()}
        <div class="absolute bottom-2 right-0 bg-red-500 text-white text-sm rounded-sm font-bold pt-1 pb-1 pr-2 pl-2">LIVE</div>
      {:else}
        {#if lengthSeconds}
          <div class="absolute bottom-2 right-0 bg-black/70 text-white text-sm rounded-sm pt-1 pb-1 pr-2 pl-2">{getFormattedTime(lengthSeconds)}</div>
        {/if}
      {/if}
    </figure>
    <div class="card-body">
      <h2 class="card-title">{title}</h2>
      <p>{author}</p>
      <p>{getViewCountDateText()}</p>
    </div>
  </div>
</button>
<!-- TODO: a dialog for every video is very slow. Need to reuse the same one -->
<dialog bind:this={modal} id="modal_{videoId}" class="modal">
  <form method="dialog" class="modal-box">
    <h3 class="font-bold text-lg">{title}</h3>
    <div class="modal-action">
      <button class="btn" on:click={playVideoOnTv}>Play on {tvName}</button>
      <button class="btn" on:click={openInvidiousInNewTab}>Play on Invidious</button>
      <button class="btn">Cancel</button>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>