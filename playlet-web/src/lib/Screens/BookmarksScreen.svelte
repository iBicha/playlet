<script lang="ts">
  import VideoListRow from "./Home/VideoListRow.svelte";
  import { bookmarksStore } from "lib/Stores";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  {#each $bookmarksStore as feed}
    <VideoListRow {feed} />
  {/each}
</div>
