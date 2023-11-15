<script lang="ts">
  import { ExternalControlProtocol } from "lib/Api/ExternalControlProtocol";

  export let key: string;
  export let icon;
  export let small: boolean = false;

  function pressKey() {
    console.log(`Sending key: ${key}`);
    ExternalControlProtocol.pressKey(key);
  }
</script>

<button
  on:click={pressKey}
  class="{small
    ? 'w-16'
    : 'w-24'} h-11 btn-primary rounded-xl flex items-center justify-center"
>
  <svelte:component this={icon} />
</button>
