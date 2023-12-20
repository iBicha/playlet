<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore } from "lib/Stores";
  import VideoStartAt from "./VideoStartAt.svelte";
  import VideoThumbnail from "./VideoThumbnail.svelte";

  export let videoId: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let videoThumbnails: any[] | undefined = undefined;
  export let author: string | undefined = undefined;
  export let lengthSeconds: number = undefined;
  export let liveNow: boolean = undefined;
  export let viewCount: number | undefined = undefined;

  export let videoStartAtChecked;
  export let videoStartAtTimestamp;

  export function show() {
    modal.showModal();
  }

  export function close() {
    modal.close();
    videoStartAtChecked = false;
    videoStartAtTimestamp = 0;
  }

  let modal;
  let tvName = "Roku TV";
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
    invidiousInstance = value?.invidious?.current_instance;
  });

  async function playOnTv() {
    await PlayletApi.playVideo(getVideoInfo());
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
      liveNow,
      viewCount,
      timestamp,
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

<dialog bind:this={modal} class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <div class="flex flex-col items-center">
      <div class="w-64">
        <VideoThumbnail
          bind:videoId
          bind:title
          bind:videoThumbnails
          bind:liveNow
          bind:lengthSeconds
          bind:viewCount
          bind:invidiousInstance
        />
      </div>
      <div class="m-4">{title || ""}</div>
    </div>
    <div class="flex flex-col">
      <VideoStartAt
        bind:checked={videoStartAtChecked}
        bind:timestamp={videoStartAtTimestamp}
        {lengthSeconds}
      />
      <div class="join join-vertical m-2">
        <button class="btn join-item hover:btn-accent" on:click={playOnTv}>
          Play on {tvName}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={queueOnTv}>
          Queue on {tvName}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={openInvidious}>
          Open in Invidious
        </button>
        <button class="btn join-item hover:btn-accent">Cancel</button>
      </div>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>Close</button>
  </form>
</dialog>
