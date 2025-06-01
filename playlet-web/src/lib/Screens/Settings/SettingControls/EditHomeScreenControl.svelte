<script lang="ts">
  import {
    homeLayoutFileStore,
    homeLayoutStore,
    translate,
    userPreferencesStore,
  } from "lib/Stores";
  import ArrowUpIcon from "assets/remote-control/arrow-up.svg.svelte";
  import ArrowDownIcon from "assets/remote-control/arrow-down.svg.svelte";
  import { PlayletApi } from "lib/Api/PlayletApi";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let level: number = 0;

  let value;
  let originalValue;
  let homeLayout;
  userPreferencesStore.subscribe((userPreferences) => {
    originalValue = userPreferences[key];
  });

  homeLayoutFileStore.subscribe((value) => {
    homeLayout = value.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {});
  });

  let modal;

  async function openHomeScreenEditor() {
    value = JSON.parse(JSON.stringify(originalValue));
    modal.showModal();
  }

  async function save() {
    if (key !== "" && value) {
      await PlayletApi.saveUserPreference(key, value);

      const refreshUserPrefrences = PlayletApi.getUserPreferences();
      refreshUserPrefrences.then((value) => {
        userPreferencesStore.set(value);
      });

      const refreshHomeLayout = PlayletApi.getHomeLayout();
      refreshHomeLayout.then((value) => {
        homeLayoutStore.set(value);
      });

      await Promise.all([refreshUserPrefrences, refreshHomeLayout]);
    }
  }

  export function close() {
    modal.close();
  }

  function onClose() {
    // Reset value to original value to avoid weird animation on show
    value = JSON.parse(JSON.stringify(originalValue));
  }

  function moveUp(index) {
    if (index > 0) {
      const updatedValue = [...value];
      [updatedValue[index - 1], updatedValue[index]] = [
        updatedValue[index],
        updatedValue[index - 1],
      ];
      value = updatedValue;
    }
  }

  function moveDown(index) {
    if (index < value.length - 1) {
      const updatedValue = [...value];
      [updatedValue[index], updatedValue[index + 1]] = [
        updatedValue[index + 1],
        updatedValue[index],
      ];
      value = updatedValue;
    }
  }
</script>

<div class="m-5">
  <div class={textSizes[level]}>{$translate(displayText)}</div>
  <div class="text-xs text-gray-500">{@html $translate(description)}</div>
  <button class="btn m-1" on:click={openHomeScreenEditor}
    >{$translate(displayText)}</button
  >
</div>

<dialog bind:this={modal} class="modal" on:close={onClose}>
  <div class="modal-box bg-base-100">
    {#if value && homeLayout}
      <table class="w-full">
        <tbody>
          {#each value as item, i (i)}
            <tr>
              <td>
                <div class="tooltip" data-tip="Move up">
                  <button
                    class="btn btn-outline btn-sm"
                    on:click={() => moveUp(i)}
                    disabled={i === 0}
                  >
                    <ArrowUpIcon />
                  </button>
                </div>
              </td>
              <td>
                <label class="label p-0 cursor-pointer">
                  <div class="label-text">
                    {$translate(homeLayout[item.id].title)}
                  </div>
                  <input
                    type="checkbox"
                    name={item.id}
                    bind:checked={item.enabled}
                    class="toggle toggle-primary"
                  />
                </label>
              </td>
              <td class="text-right">
                <div class="tooltip" data-tip="Move down">
                  <button
                    class="btn btn-outline btn-sm m-2"
                    on:click={() => moveDown(i)}
                    disabled={i === value.length - 1}
                  >
                    <ArrowDownIcon />
                  </button>
                </div>
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
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>{$translate("Close")}</button>
  </form>
</dialog>
