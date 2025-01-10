<script lang="ts">
  import { playletStateStore, translate } from "lib/Stores";
  import PlaylistCastDialog from "./PlaylistCastDialog.svelte";
  import PlaylistThumbnail from "./PlaylistThumbnail.svelte";
  import { get } from "svelte/store";

  export let title: string | undefined = undefined;
  export let author: string | undefined = undefined;
  export let playlistId: string | undefined = undefined;
  export let playlistThumbnail: string | undefined = undefined;
  export let videoCount: number | undefined = undefined;
  export let videoCountText: string | undefined = undefined;
  export let videos: any[] | undefined = undefined;
  export let updated: number | undefined = undefined;

  // svelte-ignore unused-export-let
  export let type: string = undefined;

  let modal;
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    invidiousInstance = value?.invidious?.current_instance;
  });

  function getUpdatedText() {
    if (typeof updated !== "number") {
      return "";
    }

    const span = Math.floor(Date.now() / 1000) - updated;
    if (span < 1) {
      return "";
    }

    const trFn = get(translate);

    const totalDays = Math.floor(span / 86400);
    if (totalDays > 365) {
      const years = Math.floor(totalDays / 365);
      if (years === 1) {
        return trFn("Updated 1 year ago");
      } else {
        return trFn("Updated ^n years ago").replace("^n", years.toString());
      }
    } else if (totalDays > 30) {
      const months = Math.floor(totalDays / 30);
      if (months === 1) {
        return trFn("Updated 1 month ago");
      } else {
        return trFn("Updated ^n months ago").replace("^n", months.toString());
      }
    } else if (totalDays > 7) {
      const weeks = Math.floor(totalDays / 7);
      if (weeks === 1) {
        return trFn("Updated 1 week ago");
      } else {
        return trFn("Updated ^n weeks ago").replace("^n", weeks.toString());
      }
    } else if (totalDays > 1) {
      return trFn("Updated ^n days ago").replace("^n", totalDays.toString());
    } else if (span > 3600) {
      const hours = Math.floor(span / 3600);
      if (hours === 1) {
        return trFn("Updated 1 hour ago");
      } else {
        return trFn("Updated ^n hours ago").replace("^n", hours.toString());
      }
    } else if (span > 60) {
      const minutes = Math.floor(span / 60);
      if (minutes === 1) {
        return trFn("Updated 1 minute ago");
      } else {
        return trFn("Updated ^n minutes ago").replace("^n", minutes.toString());
      }
    } else {
      return trFn("Updated 1 minute ago");
    }
  }
</script>

<button
  class="w-80 p-2"
  on:click={() => {
    modal.show();
  }}
>
  <div class="card card-compact bg-base-100 shadow-xl border border-neutral">
    <PlaylistThumbnail
      bind:title
      bind:playlistThumbnail
      bind:videoCount
      bind:videoCountText
      bind:videos
      bind:invidiousInstance
    />
    <div class="card-body">
      <h3 class="card-title text-base line-clamp-2 min-h-12">{title}</h3>
      <div class="font-semibold">{author}</div>
      <div>{getUpdatedText()}</div>
    </div>
  </div>
</button>
<PlaylistCastDialog
  bind:this={modal}
  bind:title
  bind:playlistId
  bind:playlistThumbnail
  bind:videoCount
  bind:videoCountText
  bind:videos
/>
