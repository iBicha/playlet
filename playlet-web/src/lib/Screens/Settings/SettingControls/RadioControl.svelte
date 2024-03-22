<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { tr, userPreferencesStore } from "lib/Stores";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

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
      value = event.currentTarget.value;
      await PlayletApi.saveUserPreference(key, value);
    }
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$tr(displayText)}</div>
  <div class="text-xs text-gray-500">{@html description}</div>

  {#each options as option}
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">{$tr(option.displayText)}</span>
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
</div>
