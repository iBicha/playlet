<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore, translate } from "lib/Stores";
  import VideoStartAt from "./VideoStartAt.svelte";
  import VideoThumbnail from "./VideoThumbnail.svelte";
  import { YoutubeJs } from "lib/Api/YoutubeJs";

  export let videoId: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let videoThumbnails: any[] | undefined = undefined;
  export let author: string | undefined = undefined;
  export let lengthSeconds: number = undefined;
  export let lengthText: string | undefined = undefined;
  export let liveNow: boolean = undefined;
  export let viewCount: number | undefined = undefined;
  export let isUpcoming: boolean = undefined;
  export let premiereTimestamp: number | undefined = undefined;
  export let percentDurationWatched: number | undefined = undefined;

  export let videoStartAtChecked;
  export let videoStartAtTimestamp;

  export function show() {
    modal.showModal();
  }

  export function close() {
    modal.close();
  }

  export function onClose() {
    videoStartAtChecked = false;
    videoStartAtTimestamp = 0;
  }

  let modal;
  let tvName = "Roku TV";
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
    invidiousInstance = value?.invidious?.instance;
  });

  async function playOnTv() {
    await PlayletApi.playVideo(getVideoInfo());
  }

  async function playOnTvYtjs() {
    // measure length of time it takes to get video info
    const start = performance.now();
    const videoInfoJs = await YoutubeJs.getVideoInfo(videoId);
    const end = performance.now();
    console.log(`Time to get video info: ${end - start}ms`);

    const videoInfo = getVideoInfo() as any;
    videoInfo.metadata = videoInfoJs;
    await PlayletApi.playVideo(videoInfo);
  }

  async function queueOnTv() {
    await PlayletApi.queueVideo(getVideoInfo());
  }

  function openInvidious() {
    let url = `${invidiousInstance}/watch?v=${videoId}`;
    if (videoStartAtChecked && videoStartAtTimestamp) {
      url += `&t=${videoStartAtTimestamp}`;
    }
    window.open(url);
  }

  function getVideoInfo() {
    const timestamp = videoStartAtChecked ? videoStartAtTimestamp : undefined;
    return {
      type: "video",
      videoId,
      title,
      videoThumbnails: getVideoThumbnails(),
      author,
      lengthSeconds,
      lengthText,
      liveNow,
      viewCount,
      timestamp,
      percentDurationWatched,
    };
  }

  function getVideoThumbnails() {
    if (!invidiousInstance || !videoThumbnails || !videoThumbnails.length) {
      return videoThumbnails;
    }

    return videoThumbnails.map((thumbnail) => {
      let url = thumbnail.url;
      if (url.startsWith("/")) {
        url = invidiousInstance + url;
        thumbnail.url = url;
      }
      return thumbnail;
    });
  }
</script>

<dialog bind:this={modal} class="modal" on:close={onClose}>
  <form method="dialog" class="modal-box bg-base-100">
    <div class="flex flex-col items-center">
      <div class="w-64">
        <VideoThumbnail
          bind:videoId
          bind:title
          bind:videoThumbnails
          bind:liveNow
          bind:lengthSeconds
          bind:lengthText
          bind:viewCount
          bind:isUpcoming
          bind:premiereTimestamp
          bind:invidiousInstance
          bind:percentDurationWatched
        />
      </div>
      <div class="m-4">{title || ""}</div>
    </div>
    <div class="flex flex-col">
      <VideoStartAt
        bind:checked={videoStartAtChecked}
        bind:timestamp={videoStartAtTimestamp}
        {lengthSeconds}
        {lengthText}
      />
      <div class="join join-vertical m-2">
        <button class="btn join-item hover:btn-accent" on:click={playOnTv}>
          {$translate("Play on %1").replace("%1", tvName)}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={playOnTvYtjs}>
          {$translate("Play on %1").replace("%1", tvName)} (ytjs)
        </button>
        <button class="btn join-item hover:btn-accent" on:click={queueOnTv}>
          {$translate("Queue on %1").replace("%1", tvName)}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={openInvidious}>
          {$translate("Open in Invidious")}
        </button>
        <button class="btn join-item hover:btn-accent"
          >{$translate("Cancel")}</button
        >
      </div>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>{$translate("Close")}</button>
  </form>
</dialog>
