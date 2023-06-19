<script lang="ts">
  import BooleanControl from "./SettingControls/BooleanControl.svelte";
  import RadioControl from "./SettingControls/RadioControl.svelte";
  import StringControl from "./SettingControls/StringControl.svelte";

  export let displayText: string = "";
  export let key: string = "";
  export let description: string = "";
  export let type: "boolean" | "radio" | "string" | undefined;
  export let options: any[] | undefined;
  export let visibility: string | undefined = undefined;
  export let children: any[] | undefined = [];
  export let level: number = 0;
</script>

{#if visibility !== "tv"}
  {#if type === "boolean"}
    <BooleanControl {displayText} {key} {description} {level} />
  {:else if type === "radio"}
    <RadioControl {displayText} {key} {description} {level} {options}/>
  {:else if type === "string"}
    <StringControl {displayText} {key} {description} {level} />
  {:else}
    <svelte:element this={`h${level + 2}`}>{displayText}</svelte:element>
    <div class="text-sm text-gray-500">{description}</div>
  {/if}

  {#if children}
    {#each children as child}
      <svelte:self {...child} level={level + 2} />
    {/each}
  {/if}
{/if}
