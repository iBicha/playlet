<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore, tr } from "lib/Stores";
  import PlaylistThumbnail from "./PlaylistThumbnail.svelte";

  export let title: string | undefined = undefined;
  export let playlistId: string | undefined = undefined;
  export let videoCount: number | undefined = undefined;
  export let videoCountText: string | undefined = undefined;
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
    await PlayletApi.playPlaylist(getPlaylistInfo());
  }

  async function queueOnTv() {
    await PlayletApi.queuePlaylist(getPlaylistInfo());
  }

  async function openOnTv() {
    await PlayletApi.openPlaylist(playlistId);
  }

  function openInvidious() {
    let url = `${invidiousInstance}/playlist?list=${playlistId}`;
    window.open(url);
  }

  function getPlaylistInfo() {
    return {
      type: "playlist",
      playlistId,
      title,
      playlistThumbnail: getPlaylistThumbnail(),
      videoCount,
      videoCountText,
      videos,
    };
  }

  function getPlaylistThumbnail() {
    let url = "";
    if (playlistThumbnail) {
      url = playlistThumbnail;
      if (url.startsWith("/") && invidiousInstance) {
        url = invidiousInstance + url;
      }
    } else if (videos && videos.length) {
      const video = videos[0];
      if (video.videoThumbnails) {
        const videoThumbnail =
          video.videoThumbnails.find(
            (thumbnail) => thumbnail.quality === "medium"
          ) || video.videoThumbnails[0];
        url = videoThumbnail.url;
      }
      if (url.startsWith("/") && invidiousInstance) {
        url = invidiousInstance + url;
      }
    }
    if (url === "") {
      url = `https://i.ytimg.com/vi/-----------/mqdefault.jpg`;
    }
    return url;
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
          bind:videoCountText
          bind:videos
          bind:invidiousInstance
        />
      </div>
      <div class="m-4">{title}</div>
    </div>

    <div class="flex flex-col">
      <div class="join join-vertical m-2">
        <button class="btn join-item hover:btn-accent" on:click={playOnTv}>
          {$tr("Play on %1").replace("%1", tvName)}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={queueOnTv}>
          {$tr("Queue on %1").replace("%1", tvName)}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={openOnTv}>
          {$tr("Open on %1").replace("%1", tvName)}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={openInvidious}>
          {$tr("Open in Invidious")}
        </button>
        <button class="btn join-item hover:btn-accent">{$tr("Cancel")}</button>
      </div>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>{$tr("Close")}</button>
  </form>
</dialog>
