<script lang="ts">
  import BooleanControl from "lib/Screens/Settings/SettingControls/BooleanControl.svelte";
  import ClearSearchHistoryControl from "lib/Screens/Settings/SettingControls/ClearSearchHistoryControl.svelte";
  import ClearContinueWatchingControl from "lib/Screens/Settings/SettingControls/ClearContinueWatchingControl.svelte";
  import EditHomeScreenControl from "lib/Screens/Settings/SettingControls/EditHomeScreenControl.svelte";
  import RadioControl from "lib/Screens/Settings/SettingControls/RadioControl.svelte";
  import StringControl from "lib/Screens/Settings/SettingControls/StringControl.svelte";
  import NumberControl from "./SettingControls/NumberControl.svelte";

  const textSizes = ["text-2xl", "text-lg", "text-base", "text-sm", "text-xs"];

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let type: "boolean" | "radio" | "string" | "number" | undefined =
    undefined;
  export let svelteComponent: string | undefined = undefined;
  export let options: any[] | undefined = undefined;
  export let min: number = -999999;
  export let max: number = 999999;
  export let visibility: string | undefined = undefined;
  export let children: any[] | undefined = [];
  export let level: number = 0;

  // svelte-ignore unused-export-let
  export let defaultValue: any = undefined;
  // svelte-ignore unused-export-let
  export let rokuComponent: any = undefined;

  const customComponents = {
    ClearSearchHistoryControl,
    ClearContinueWatchingControl,
    EditHomeScreenControl,
  };
</script>

{#if visibility !== "tv"}
  {#if type === "boolean"}
    <BooleanControl {displayText} {key} {description} {level} />
  {:else if type === "radio"}
    <RadioControl {displayText} {key} {description} {level} {options} />
  {:else if type === "string"}
    <StringControl {displayText} {key} {description} {level} />
  {:else if type === "number"}
    <NumberControl {displayText} {key} {description} {level} {min} {max} />
  {:else if svelteComponent}
    <svelte:component
      this={customComponents[svelteComponent]}
      {displayText}
      {key}
      {description}
      {level}
    />
  {:else}
    <div class="m-5">
      <div class={textSizes[level]}>{displayText}</div>
      <div class="text-xs text-gray-500">{description}</div>
    </div>
  {/if}

  {#if children}
    {#each children as child}
      <svelte:self {...child} level={level + 1} />
    {/each}
  {/if}
{/if}
