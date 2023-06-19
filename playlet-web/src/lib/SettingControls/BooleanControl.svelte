<script lang="ts">
  import { PlayletApi } from "../PlayletApi";
  import { userPreferencesStore } from "../Stores";

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  let value;
  userPreferencesStore.subscribe((userPreferences) => {
    value = userPreferences[key];
  });

  async function handleChange() {
    if(key !== "") {
        await PlayletApi.saveUserPreference(key, value);
    }
  }
</script>

<div class="form-control">
  <label class="label cursor-pointer">
    <span class="label-text">{displayText}</span>
    <input
      type="checkbox"
      name={key}
      bind:checked={value}
      on:change={handleChange}
      class="checkbox"
    />
  </label>
  <div class="text-sm text-gray-500">{description}</div>
</div>
<!-- 
<svelte:element this={`h${level + 2}`}>{displayText}</svelte:element>

<input type="checkbox" checked class="checkbox" /> -->
