<script lang="ts">
  import { PlayletApi } from "./PlayletApi";

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

  async function playVideo() {
    await PlayletApi.playVideo(videoId);
  }
</script>

<button class="w-96" on:click={playVideo}>
  <div class="card bg-base-100 shadow-xl border border-neutral">
    <figure>
      <img class="w-full rounded-box" loading="lazy" src={getThumbnailUrl()} alt={title} />
    </figure>
    <div class="card-body">
      <h2 class="card-title">{title}</h2>
      <p>{author}</p>
      <p>{getViewCountDateText()}</p>
    </div>
  </div>
</button>
