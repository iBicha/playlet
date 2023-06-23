<script lang="ts">
  import { PlayletApi } from "./PlayletApi";
  import SettingsNode from "./SettingsNode.svelte";
  import { preferencesModelStore, userPreferencesStore } from "./Stores";
  import { onMount } from "svelte";

  export let visibility: boolean;

  onMount(async () => {
    const getPreferencesFile = PlayletApi.getPreferencesFile();
    const getUserPreferences = PlayletApi.getUserPreferences();
    const preferencesFile = await getPreferencesFile;
    const userPreferences = await getUserPreferences;
    preferencesModelStore.set(preferencesFile);
    userPreferencesStore.set(userPreferences);
  });
</script>

<div class="{visibility ? "" : "hidden"}">
  {#each $preferencesModelStore as pref, i}
    {#if pref.visibility !== "tv"}
      <SettingsNode {...pref} />
      {#if i !== $preferencesModelStore.length - 1}
        <div class="divider" />
      {/if}
    {/if}
  {/each}
</div>
