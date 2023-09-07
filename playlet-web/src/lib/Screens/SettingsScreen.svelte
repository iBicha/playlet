<script lang="ts">
  import DevSettings from "lib/Screens/Settings/DevSettings.svelte";
  import SettingsNode from "lib/Screens/Settings/SettingsNode.svelte";
  import { preferencesModelStore } from "lib/Stores";
  import { onMount } from "svelte";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  {#each $preferencesModelStore as pref, i}
    {#if pref.visibility !== "tv"}
      <SettingsNode {...pref} />
      {#if i !== $preferencesModelStore.length - 1}
        <div class="divider" />
      {/if}
    {/if}
  {/each}
  <div class="divider" />
  <DevSettings />
</div>
