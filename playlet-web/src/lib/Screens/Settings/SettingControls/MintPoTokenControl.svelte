<script lang="ts">
  import { translate } from "lib/Stores";
  import { ensureDevicePoTokenWithToast } from "lib/ensureDevicePoToken";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  // svelte-ignore unused-export-let
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$translate(displayText)}</div>
  <div class="text-xs text-gray-500">{@html $translate(description)}</div>
  <button class="btn m-1" on:click={() => ensureDevicePoTokenWithToast()}
    >{$translate("Mint PoToken")}</button
  >
</div>
