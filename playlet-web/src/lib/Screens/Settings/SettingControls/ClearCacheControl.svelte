<script lang="ts">
  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { tr } from "lib/Stores";
  import { get } from "svelte/store";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  // svelte-ignore unused-export-let
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  async function clearCache() {
    await PlayletApi.clearCache();
    InvidiousApi.clearCache();

    alert(get(tr)("Cache cleared."));
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$tr(displayText)}</div>
  <div class="text-xs text-gray-500">{@html $tr(description)}</div>
  <button class="btn m-1" on:click={clearCache}>{$tr("Clear cache")}</button>
</div>
