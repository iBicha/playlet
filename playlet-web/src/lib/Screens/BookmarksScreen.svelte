<script lang="ts">
  import VideoListRow from "lib/VideoFeed/VideoListRow.svelte";
  import { bookmarksStore, translate } from "lib/Stores";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  {#if $bookmarksStore.length === 0}
    <div
      class="flex flex-col items-center justify-start h-screen w-2/3 mx-auto"
    >
      <div class="text-2xl font-bold text-gray-500">
        {$translate("No Bookmarks")}
      </div>
      <div class="text-gray-500 text-center">
        {$translate("You currently have no bookmarks.")}<br />
        {$translate(
          "To add bookmarks, select a video, playlist or channel, and add a bookmark."
        )}<br />
        {$translate("Please note that Bookmarks is an experimental feature.")}
      </div>
    </div>
  {:else}
    {#each $bookmarksStore as feed}
      <VideoListRow {feed} />
    {/each}
  {/if}
</div>
