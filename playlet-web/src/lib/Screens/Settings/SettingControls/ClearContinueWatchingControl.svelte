<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  // svelte-ignore unused-export-let
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  async function clearContinueWatching() {
    await PlayletApi.clearContinueWatching();
    alert("Continue watching cleared.");
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{displayText}</div>
  <div class="text-xs text-gray-500">{@html description}</div>
  <button class="btn m-1" on:click={clearContinueWatching}
    >Clear continue watching</button
  >
</div>
