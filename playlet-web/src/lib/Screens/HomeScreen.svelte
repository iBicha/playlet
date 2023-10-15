<script lang="ts">
  import ScreenHomeRow from "lib/Screens/Home/ScreenHomeRow.svelte";
  import { homeLayoutFileStore } from "lib/Stores";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  {#each $homeLayoutFileStore as feed}
    <ScreenHomeRow {feed} />
  {/each}
</div>
