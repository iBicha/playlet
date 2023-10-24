<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore } from "lib/Stores";

  export let title: string | undefined = undefined;
  export let author: string | undefined = undefined;
  export let playlistId: string | undefined = undefined;
  export let playlistThumbnail: string | undefined = undefined;
  export let videoCount: number | undefined = undefined;
  export let videos: any[] | undefined = undefined;

  // svelte-ignore unused-export-let
  export let type: string = undefined;

  let modal;
  let tvName = "Roku TV";
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
    invidiousInstance = value?.invidious?.current_instance;
  });

  function getThumbnailUrl(quality: string = "medium") {
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
            (thumbnail) => thumbnail.quality === quality
          ) || video.videoThumbnails[0];
        url = videoThumbnail.url;
      }
      if (url.startsWith("/") && invidiousInstance) {
        url = invidiousInstance + url;
      }
    }
    if (url === "") {
      url = `${invidiousInstance}/vi/-----------/mqdefault.jpg`;
    }
    return url;
  }

  async function playPlaylistOnTv() {
    await PlayletApi.playPlaylist(playlistId, title, videoCount);
  }

  async function queuePlaylistOnTv() {
    await PlayletApi.queuePlaylist(playlistId, title, videoCount);
  }

  async function openPlaylistOnTv() {
    await PlayletApi.openPlaylist(playlistId);
  }

  function openInvidiousInNewTab() {
    let url = `${invidiousInstance}/playlist?list=${playlistId}`;
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
      <div
        class="absolute bottom-2 right-0 bg-black/70 text-white text-sm rounded-sm pt-1 pb-1 pr-2 pl-2"
      >
        {videoCount} videos
      </div>
    </figure>
    <div class="card-body">
      <h3 class="card-title text-base line-clamp-2 min-h-12">{title}</h3>
      <div class="font-semibold">{author}</div>
    </div>
  </div>
</button>
<!-- TODO:P2 a dialog for every video is very slow. Need to reuse the same one -->
<dialog bind:this={modal} id="modal_{playlistId}" class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <h3 class="text-lg m-5">{title}</h3>
    <div class="flex flex-col">
      <button class="btn m-2" on:click={playPlaylistOnTv}>
        Play on {tvName}
      </button>
      <button class="btn m-2" on:click={queuePlaylistOnTv}>
        Queue on {tvName}
      </button>
      <button class="btn m-2" on:click={openPlaylistOnTv}>
        Open on {tvName}
      </button>
      <button class="btn m-2" on:click={openInvidiousInNewTab}>
        Open in Invidious
      </button>
      <button class="btn m-2">Cancel</button>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
