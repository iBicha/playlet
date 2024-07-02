<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { tr, userPreferencesStore } from "lib/Stores";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];
  const invidiousPublicInstancesLink = `<a class="link" href="https://api.invidious.io" target="_blank" rel="noopener noreferrer">https://api.invidious.io</a>`;

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  let inputValue;
  let currentValue;
  userPreferencesStore.subscribe((userPreferences) => {
    currentValue = userPreferences[key];
    inputValue = currentValue;
  });

  async function save() {
    if (key !== "") {
      const value = inputValue;
      await PlayletApi.saveUserPreference(key, value);
      currentValue = inputValue = value;
    }
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$tr(displayText)}</div>
  <div class="text-xs text-gray-500">
    <!-- TODO:P2 this should not be hardcoded here -->
    {@html $tr(description).replace(
      "%INVIDIOUS_PUBLIC_INSTANCES%",
      invidiousPublicInstancesLink
    )}
  </div>

  <div class="join w-full m-1">
    <input
      type="text"
      name={key}
      bind:value={inputValue}
      placeholder={displayText}
      class="join-item input w-full mr-1"
    />
    {#if inputValue !== currentValue}
      <button class="join-item btn" on:click={save}>{$tr("Save")}</button>
    {/if}
  </div>
</div>
