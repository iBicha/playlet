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
  export let updated: number | undefined = undefined;

  // svelte-ignore unused-export-let
  export let type: string = undefined;

  let modal;
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    invidiousInstance = value?.invidious?.current_instance;
  });

  function GetUpdatedText(updated) {
    if (typeof updated !== "number") {
      return "";
    }

    const span = Math.floor(Date.now() / 1000) - updated;
    if (span < 1) {
      return "";
    }

    let count = "";
    const totalDays = Math.floor(span / 86400);
    if (totalDays > 365) {
      const years = Math.floor(totalDays / 365);
      count = years > 1 ? `${years} years` : "1 year";
    } else if (totalDays > 30) {
      const months = Math.floor(totalDays / 30);
      count = months > 1 ? `${months} months` : "1 month";
    } else if (totalDays > 7) {
      const weeks = Math.floor(totalDays / 7);
      count = weeks > 1 ? `${weeks} weeks` : "1 week";
    } else if (totalDays > 1) {
      count = `${totalDays} days`;
    } else if (span > 3600) {
      const hours = Math.floor(span / 3600);
      count = hours > 1 ? `${hours} hours` : "1 hour";
    } else if (span > 60) {
      const minutes = Math.floor(span / 60);
      count = minutes > 1 ? `${minutes} minutes` : "1 minute";
    } else {
      count = span > 1 ? `${span} seconds` : "1 second";
    }

    if (count === "") {
      return "";
    }

    return `Updated ${count} ago`;
  }
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
      <div>{GetUpdatedText(updated)}</div>
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
