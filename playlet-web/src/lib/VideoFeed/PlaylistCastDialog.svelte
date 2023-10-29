<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore } from "lib/Stores";
  import PlaylistThumbnail from "./PlaylistThumbnail.svelte";

  export let title: string | undefined = undefined;
  export let playlistId: string | undefined = undefined;
  export let videoCount: number | undefined = undefined;
  export let playlistThumbnail: string | undefined = undefined;
  export let videos: any[] | undefined = undefined;

  export function show() {
    modal.showModal();
  }

  export function close() {
    modal.close();
  }

  let modal;
  let tvName = "Roku TV";
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
    invidiousInstance = value?.invidious?.current_instance;
  });

  async function playOnTv() {
    await PlayletApi.playPlaylist(playlistId, title, videoCount);
  }

  async function queueOnTv() {
    await PlayletApi.queuePlaylist(playlistId, title, videoCount);
  }

  async function openOnTv() {
    await PlayletApi.openPlaylist(playlistId);
  }

  function openInvidious() {
    let url = `${invidiousInstance}/playlist?list=${playlistId}`;
    window.open(url);
  }
</script>

<dialog bind:this={modal} class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <div class="flex flex-col items-center">
      <div class="w-64">
        <PlaylistThumbnail
          bind:title
          bind:playlistThumbnail
          bind:videoCount
          bind:videos
          bind:invidiousInstance
        />
      </div>
      <div class="m-4">{title}</div>
    </div>

    <div class="flex flex-col">
      <div class="join join-vertical m-2">
        <button class="btn join-item hover:btn-accent" on:click={playOnTv}>
          Play on {tvName}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={queueOnTv}>
          Queue on {tvName}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={openOnTv}>
          Open on {tvName}
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
