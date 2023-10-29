<script lang="ts">
  import { playletStateStore } from "lib/Stores";
  import PlaylistCastDialog from "./PlaylistCastDialog.svelte";
  import PlaylistThumbnail from "./PlaylistThumbnail.svelte";

  export let title: string | undefined = undefined;
  export let author: string | undefined = undefined;
  export let playlistId: string | undefined = undefined;
  export let playlistThumbnail: string | undefined = undefined;
  export let videoCount: number | undefined = undefined;
  export let videos: any[] | undefined = undefined;

  // svelte-ignore unused-export-let
  export let type: string = undefined;

  let modal;
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    invidiousInstance = value?.invidious?.current_instance;
  });
</script>

<button class="w-80 p-2" on:click={modal.show()}>
  <div class="card card-compact bg-base-100 shadow-xl border border-neutral">
    <PlaylistThumbnail
      bind:title
      bind:playlistThumbnail
      bind:videoCount
      bind:videos
      bind:invidiousInstance
    />
    <div class="card-body">
      <h3 class="card-title text-base line-clamp-2 min-h-12">{title}</h3>
      <div class="font-semibold">{author}</div>
    </div>
  </div>
</button>
<PlaylistCastDialog
  bind:this={modal}
  bind:title
  bind:playlistId
  bind:playlistThumbnail
  bind:videoCount
  bind:videos
/>
