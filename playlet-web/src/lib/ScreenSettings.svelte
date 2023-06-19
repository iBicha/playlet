<script lang="ts">
  import { PlayletApi } from "./PlayletApi";
  import SettingsNode from "./SettingsNode.svelte";
  import { preferencesModelStore, userPreferencesStore } from "./Stores";
  import { onMount } from "svelte";

  onMount(async () => {
    const getPreferencesFile = PlayletApi.getPreferencesFile();
    const getUserPreferences = PlayletApi.getUserPreferences();
    const preferencesFile = await getPreferencesFile;
    const userPreferences = await getUserPreferences;
    preferencesModelStore.set(preferencesFile);
    userPreferencesStore.set(userPreferences);
  });

  let preferencesModel;
  preferencesModelStore.subscribe((value) => {
    preferencesModel = value;
  });
</script>

<div class="container">
  {#each preferencesModel as pref, i}
    {#if pref.visibility !== "tv"}
      <SettingsNode {...pref} />
      {#if i !== preferencesModel.length - 1}
        <div class="divider" />
      {/if}
    {/if}
  {/each}
</div>
