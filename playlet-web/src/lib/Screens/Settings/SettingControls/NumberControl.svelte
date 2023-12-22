<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { userPreferencesStore } from "lib/Stores";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;
  export let min: number = -999999;
  export let max: number = 999999;

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
    <div class="join mt-2 mb-2">
      <button
        class="join-item btn btn-sm btn-primary"
        on:click={() => {
          value = Math.max(min, value - 1);
          handleChange();
        }}
      >
        -
      </button>
      <input
        class="join-item input input-bordered input-sm"
        type="number"
        name={key}
        {min}
        {max}
        bind:value
        on:change={handleChange}
      />
      <button
        class="join-item btn btn-sm btn-primary"
        on:click={() => {
          value = Math.min(max, value + 1);
          handleChange();
        }}
      >
        +
      </button>
    </div>
  </label>
  <div class="text-xs text-gray-500">{@html description}</div>
</div>
