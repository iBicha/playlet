<script lang="ts">
  import ScreenHomeRow from "./ScreenHomeRow.svelte";
  import { homeLayoutFileStore } from "./Stores";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  {#each $homeLayoutFileStore as homeLayoutItem}
    <ScreenHomeRow requestData={homeLayoutItem} />
  {/each}
</div>
