<script lang="ts">
  import { PlayletApi } from "../PlayletApi";
  import { userPreferencesStore } from "../Stores";

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

<svelte:element this={`h${level + 2}`}>{displayText}</svelte:element>
<div class="text-sm text-gray-500">{description}</div>

<input
  type="text"
  name={key}
  bind:value="{inputValue}"
  placeholder={displayText}
  class="input input-bordered w-full max-w-xs"
/>
{#if inputValue !== currentValue}
<button class="btn" on:click={save}>Save</button>
{/if}
