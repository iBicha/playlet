<script lang="ts">
  import { PlayletApi } from "../PlayletApi";
  import { userPreferencesStore } from "../Stores";

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;
  export let options: any[] = [];

  let value;
  userPreferencesStore.subscribe((userPreferences) => {
    value = userPreferences[key];
  });

  async function handleChange(event) {
    if (key !== "") {
        value = event.currentTarget.value
        await PlayletApi.saveUserPreference(key, value);
    }
  }
</script>

<svelte:element this={`h${level + 2}`}>{displayText}</svelte:element>
<div class="text-sm text-gray-500">{description}</div>

{#each options as option}
  <div class="form-control">
    <label class="label cursor-pointer">
      <span class="label-text">{option.displayText}</span>
      <input
        type="radio"
        name={key}
        value={option.value}
        class="radio"
        checked={value === option.value}
        on:change={handleChange}
      />
    </label>
  </div>
{/each}
