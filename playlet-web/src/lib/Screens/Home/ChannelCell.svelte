<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore } from "lib/Stores";

  export let author: string | undefined = undefined;
  export let authorId: string | undefined = undefined;
  export let authorThumbnails: any[] | undefined = undefined;
  export let videoCount: number | undefined = undefined;
  export let subCount: number | undefined = undefined;

  // svelte-ignore unused-export-let
  export let type: string = undefined;

  let modal;
  let tvName = "Roku TV";
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
    invidiousInstance = value?.invidious?.current_instance;
  });

  function getThumbnailUrl() {
    if (!authorThumbnails || authorThumbnails.length === 0) {
      return "";
    }
    const authorThumbnail = authorThumbnails[authorThumbnails.length - 1];
    let url = authorThumbnail.url;
    if (url.startsWith("//")) {
      url = "https:" + url;
    }
    return url;
  }

  async function openChannelOnTv() {
    // TODO:P1 open channel on TV
    // await PlayletApi.playPlaylist(playlistId, title, videoCount);
  }

  function openInvidiousInNewTab() {
    let url = `${invidiousInstance}/channel/${authorId}`;
    window.open(url);
  }
</script>

<button class="w-60 p-2" on:click={modal.showModal()}>
  <div class="card card-compact bg-base-100 shadow-xl border border-neutral">
    <figure class="relative">
      <img
        class="w-44 rounded-full aspect-square object-cover"
        loading="lazy"
        width="176"
        height="176"
        src={getThumbnailUrl()}
        alt={author}
      />
    </figure>
    <div class="card-body">
      <h3 class="card-title text-base line-clamp-1 min-h-8">{author}</h3>
      <div>{subCount} subscribers</div>
      <div>{videoCount} videos</div>
    </div>
  </div>
</button>
<!-- TODO:P2 a dialog for every video is very slow. Need to reuse the same one -->
<dialog bind:this={modal} id="modal_{authorId}" class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <h3 class="text-lg m-5">{author}</h3>
    <div class="flex flex-col">
      <!-- <button class="btn m-2" on:click={openChannelOnTv}
        >Open on {tvName}</button
      > -->
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
