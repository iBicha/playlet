<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { searchHistoryStore, translate } from "lib/Stores";
  import { get } from "svelte/store";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  // svelte-ignore unused-export-let
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  async function clearSeachHistory() {
    await PlayletApi.clearSearchHistory();
    searchHistoryStore.set([]);

    alert(get(translate)("Search history cleared."));
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$translate(displayText)}</div>
  <div class="text-xs text-gray-500">{@html $translate(description)}</div>
  <button class="btn m-1" on:click={clearSeachHistory}
    >{$translate("Clear search history")}</button
  >
</div>
