<script lang="ts">
  import {
    sponsorBlockConfigStore,
    translate,
    userPreferencesStore,
  } from "lib/Stores";
  import { PlayletApi } from "lib/Api/PlayletApi";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  const optionTitles = {
    disable: "Disable",
    auto_skip: "Auto Skip",
    manual_skip: "Manual Skip",
    show_in_seekbar: "Show in Seekbar",
  };

  export let displayText: string = "";
  // svelte-ignore unused-export-let
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  let value;
  let originalValue;
  userPreferencesStore.subscribe((userPreferences) => {
    originalValue = userPreferences[key];
  });

  let sponsorBlockConfig;
  sponsorBlockConfigStore.subscribe((config) => {
    sponsorBlockConfig = config;
  });

  let modal;

  async function openEditor() {
    value = JSON.parse(JSON.stringify(originalValue));
    modal.showModal();
  }

  async function save() {
    if (key !== "" && value) {
      await PlayletApi.saveUserPreference(key, value);
      const userPreferences = await PlayletApi.getUserPreferences();
      userPreferencesStore.set(userPreferences);
    }
  }

  export function close() {
    modal.close();
  }

  function onClose() {
    // Reset value to original value to avoid weird animation on show
    value = JSON.parse(JSON.stringify(originalValue));
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$translate(displayText)}</div>
  <div class="text-xs text-gray-500">{@html $translate(description)}</div>
  <button class="btn m-1" on:click={openEditor}
    >{$translate(displayText)}</button
  >
</div>

<dialog bind:this={modal} class="modal" on:close={onClose}>
  <div class="modal-box bg-base-100">
    {#if value && sponsorBlockConfig}
      <table class="w-full">
        <tbody>
          {#each sponsorBlockConfig.categoryList as category}
            {#if value[category]}
              <tr>
                <td>
                  <div
                    style="
                      width: 32px;
                      height: 24px;
                      border-radius: 2px;
                      background: {sponsorBlockConfig.categories[category]
                      .color};
                      border: 1px solid #ccc;
                      display: inline-block;
                    "
                  ></div>
                </td>
                <td>
                  <div>
                    {$translate(sponsorBlockConfig.categories[category].title)}
                  </div>
                </td>
                <td>
                  <div>
                    <select
                      bind:value={value[category].option}
                      class="select select-bordered select-sm"
                    >
                      {#each sponsorBlockConfig.categories[category].options as option}
                        <option value={option}
                          >{$translate(optionTitles[option])}</option
                        >
                      {/each}
                    </select>
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
      <form method="dialog" class="flex justify-center space-x-2 m-2">
        <button class="btn btn-primary" on:click={save}
          >{$translate("Save")}</button
        >
        <button class="btn btn-primary">{$translate("Close")}</button>
      </form>
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>{$translate("Close")}</button>
  </form>
</dialog>
