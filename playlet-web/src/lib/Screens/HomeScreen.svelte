<script lang="ts">
  import VideoListRow from "lib/Screens/Home/VideoListRow.svelte";
  import { homeLayoutFileStore } from "lib/Stores";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  {#each $homeLayoutFileStore as feed}
    <VideoListRow {feed} />
  {/each}
</div>
