<script lang="ts">
  import VideoListRow from "lib/VideoFeed/VideoListRow.svelte";
  import { homeLayoutFileStore } from "lib/Stores";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  <!-- TODO:P0 Handle authenticated feed when not logged in -->
  {#each $homeLayoutFileStore as feed}
    <VideoListRow {feed} />
  {/each}
</div>
