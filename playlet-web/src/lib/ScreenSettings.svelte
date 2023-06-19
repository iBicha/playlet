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

<!-- <p class="text-sm font-bold m-6">This is a small bold text.</p>
<p class="text-base text-gray-600">This is a base-sized gray text.</p>
<p class="text-2xl uppercase">This is an extra large uppercase text.</p> -->

<article class="prose container">
  {#each preferencesModel as pref}
    <SettingsNode {...pref} />
  {/each}
</article>
