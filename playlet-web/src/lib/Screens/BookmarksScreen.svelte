<script lang="ts">
  import { bookmarksStore } from "lib/Stores";
  import ScreenHomeRow from "./Home/ScreenHomeRow.svelte";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  {#each $bookmarksStore as feed}
    <ScreenHomeRow {feed} />
  {/each}
</div>
