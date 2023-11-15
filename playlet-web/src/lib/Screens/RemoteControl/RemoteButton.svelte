<script lang="ts">
  import { ExternalControlProtocol } from "lib/Api/ExternalControlProtocol";

  export let key: string;
  export let icon;

  function pressKey() {
    console.log(`Sending key: ${key}`);
    ExternalControlProtocol.pressKey(key);
  }
</script>

<button
  on:click={pressKey}
  class="w-28 h-11 btn-primary rounded-xl flex items-center justify-center"
>
  <svelte:component this={icon} />
</button>
