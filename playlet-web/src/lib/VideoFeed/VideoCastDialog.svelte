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
    const timestamp = videoStartAtChecked ? videoStartAtTimestamp : undefined;
    await PlayletApi.playVideo(videoId, timestamp, title, author);
  }

  async function queueOnTv() {
    const timestamp = videoStartAtChecked ? videoStartAtTimestamp : undefined;
    await PlayletApi.queueVideo(videoId, timestamp, title, author);
  }

  function openInvidious() {
    let url = `${invidiousInstance}/watch?v=${videoId}`;
    if (videoStartAtChecked && videoStartAtTimestamp) {
      url += `&t=${videoStartAtTimestamp}`;
    }
    window.open(url);
  }
</script>

<dialog bind:this={modal} class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <div class="flex flex-col items-center">
      <div class="w-64">
        <VideoThumbnail
          bind:title
          bind:videoThumbnails
          bind:liveNow
          bind:lengthSeconds
          bind:viewCount
          bind:invidiousInstance
        />
      </div>
      <div class="m-4">{title}</div>
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
