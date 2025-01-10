<script lang="ts">
  import SettingsNode from "lib/Screens/Settings/SettingsNode.svelte";
  import { preferencesModelStore } from "lib/Stores";

  export let visibility: boolean;
</script>

<div class={visibility ? "" : "hidden"}>
  {#each $preferencesModelStore as pref, i}
    {#if pref.visibility !== "tv"}
      <SettingsNode {...pref} />
      {#if i !== $preferencesModelStore.length - 1}
        <div class="divider"></div>
      {/if}
    {/if}
  {/each}
</div>
