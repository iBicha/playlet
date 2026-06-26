<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { translate } from "lib/Stores";
  import { get } from "svelte/store";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  // svelte-ignore unused-export-let
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  async function clearPoTokens() {
    await PlayletApi.clearPoTokens();
    alert(get(translate)("PoTokens cleared."));
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$translate(displayText)}</div>
  <div class="text-xs text-gray-500">{@html $translate(description)}</div>
  <button class="btn m-1" on:click={clearPoTokens}
    >{$translate("Clear PoTokens")}</button
  >
</div>
