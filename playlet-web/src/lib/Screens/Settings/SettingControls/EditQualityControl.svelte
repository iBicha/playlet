<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { translate, userPreferencesStore } from "lib/Stores";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];
  const qualityLabels = {
    auto: "Auto",
    "1080p": "1080p",
    "720p": "720p",
    "480p": "480p",
    "360p": "360p",
    "240p": "240p",
    "144p": "144p",
  };

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  let valueCheckedStates: any = {};
  let originalValue;
  let displayValue;

  userPreferencesStore.subscribe((userPreferences) => {
    originalValue = userPreferences[key];
  });

  $: {
    if (!originalValue) {
      valueCheckedStates = {};
      displayValue = "";
    } else {
      valueCheckedStates = Object.keys(qualityLabels).reduce((acc, cur) => {
        acc[cur] = originalValue.includes(cur);
        return acc;
      }, {});
      displayValue = originalValue
        .split(",")
        .map((item) => $translate(qualityLabels[item] || item))
        .join(", ");
    }
  }

  let modal;

  async function openQualitySelector() {
    valueCheckedStates = Object.keys(qualityLabels).reduce((acc, cur) => {
      acc[cur] = originalValue.includes(cur);
      return acc;
    }, {});
    modal.showModal();
  }

  async function save() {
    if (key !== "" && valueCheckedStates) {
      const stringValue = Object.keys(valueCheckedStates)
        .filter((key) => valueCheckedStates[key])
        .join(",");
      await PlayletApi.saveUserPreference(key, stringValue);

      const refreshUserPrefrences = PlayletApi.getUserPreferences();
      refreshUserPrefrences.then((value) => {
        userPreferencesStore.set(value);
      });

      await userPreferencesStore;
    }
  }

  export function close() {
    modal.close();
  }

  function onClose() {
    // Reset value to original value to avoid weird animation on show
    valueCheckedStates = Object.keys(qualityLabels).reduce((acc, cur) => {
      acc[cur] = originalValue.includes(cur);
      return acc;
    }, {});
  }

  function onChange(e: Event, quality: string) {
    const target = e.target as HTMLInputElement;
    valueCheckedStates[quality] = target.checked;

    const autoChanged = quality === "auto";
    const hasAuto = valueCheckedStates.auto;

    if (autoChanged) {
      if (hasAuto) {
        Object.keys(valueCheckedStates).forEach((key) => {
          valueCheckedStates[key] = key === "auto";
        });
        return;
      } else {
        valueCheckedStates = Object.keys(qualityLabels).reduce((acc, cur) => {
          acc[cur] = cur !== "auto";
          return acc;
        }, {});
        return;
      }
    }

    const checkedCount = Object.keys(valueCheckedStates).filter(
      (key) => valueCheckedStates[key]
    ).length;
    if (checkedCount === 0) {
      valueCheckedStates.auto = true;
      return;
    }

    if (checkedCount > 1 && valueCheckedStates.auto) {
      valueCheckedStates.auto = false;
    }
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$translate(displayText)}</div>
  <div class="text-xs text-gray-500">{@html $translate(description)}</div>
  <button class="btn m-1" on:click={openQualitySelector}>{displayValue}</button>
</div>

<dialog bind:this={modal} class="modal" on:close={onClose}>
  <div class="modal-box bg-base-100">
    <table class="w-full">
      <tbody>
        {#each Object.keys(qualityLabels) as quality}
          <tr>
            <td>
              <label class="label p-0 cursor-pointer">
                <div class="label-text text-lg">
                  {$translate(qualityLabels[quality])}
                </div>
                <input
                  type="checkbox"
                  checked={valueCheckedStates[quality]}
                  on:change={(e) => onChange(e, quality)}
                  class="toggle toggle-primary"
                />
              </label>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <form method="dialog" class="flex justify-center space-x-2">
      <button class="btn btn-primary" on:click={save}
        >{$translate("Save")}</button
      >
      <button class="btn btn-primary">{$translate("Close")}</button>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>{$translate("Close")}</button>
  </form>
</dialog>
