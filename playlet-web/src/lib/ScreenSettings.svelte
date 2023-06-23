<script lang="ts">
  import DevSettings from "./DevSettings.svelte";
  import { PlayletApi } from "./PlayletApi";
  import SettingsNode from "./SettingsNode.svelte";
  import { preferencesModelStore, userPreferencesStore } from "./Stores";
  import { onMount } from "svelte";

  export let visibility: boolean;

  let developerOptionsEnabled = false;

  onMount(async () => {
    PlayletApi.getPreferencesFile().then((value) => {
      preferencesModelStore.set(value);
    });
    PlayletApi.getUserPreferences().then((value) => {
      userPreferencesStore.set(value);
    });

    const urlParams = new URLSearchParams(window.location.search);
    developerOptionsEnabled = !!urlParams.get("dev");
  });
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
  {#if developerOptionsEnabled}
    <div class="divider" />
    <DevSettings />
  {/if}
</div>
