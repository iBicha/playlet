<script lang="ts">
  import { PlayletApi } from "../PlayletApi";
  import { userPreferencesStore } from "../Stores";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  let value;
  userPreferencesStore.subscribe((userPreferences) => {
    value = userPreferences[key];
  });

  async function handleChange() {
    if (key !== "") {
      await PlayletApi.saveUserPreference(key, value);
    }
  }
</script>

<div class="form-control m-5">
  <label class="label p-0 cursor-pointer">
    <div class="label-text {textSizes[level]}">{displayText}</div>
    <input
      type="checkbox"
      name={key}
      bind:checked={value}
      on:change={handleChange}
      class="checkbox"
    />
  </label>
  <div class="text-xs text-gray-500">{@html description}</div>
</div>
