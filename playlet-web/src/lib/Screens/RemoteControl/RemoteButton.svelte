<script lang="ts">
  import { ExternalControlProtocol } from "lib/Api/ExternalControlProtocol";
  import { onDestroy, onMount } from "svelte";

  export let key: string;
  export let icon;
  export let small: boolean = false;
  export let singlePressEvent: boolean = false;

  let button;

  onMount(() => {
    const isTouchDevice = "ontouchstart" in document.documentElement;
    if (isTouchDevice) {
      button.addEventListener("touchstart", pressKeyDown);
      button.addEventListener("touchend", pressKeyUp);
      button.addEventListener("touchcancel", onMouseLeave);
    } else {
      button.addEventListener("mousedown", pressKeyDown);
      button.addEventListener("mouseup", pressKeyUp);
      button.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      if (isTouchDevice) {
        button.removeEventListener("touchstart", pressKeyDown);
        button.removeEventListener("touchend", pressKeyUp);
        button.removeEventListener("touchcancel", onMouseLeave);
      } else {
        button.removeEventListener("mousedown", pressKeyDown);
        button.removeEventListener("mouseup", pressKeyUp);
        button.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  });

  let isDown = false;
  function pressKeyDown() {
    isDown = true;
    if (singlePressEvent) {
      ExternalControlProtocol.pressKey(key);
    } else {
      ExternalControlProtocol.pressKeyDown(key);
    }
  }

  function pressKeyUp() {
    isDown = false;
    if (singlePressEvent) {
      return;
    }
    ExternalControlProtocol.pressKeyUp(key);
  }

  function onMouseLeave() {
    if (isDown) {
      pressKeyUp();
    }
  }
</script>

<button
  bind:this={button}
  class="{small
    ? 'w-16'
    : 'w-24'} h-11 btn btn-primary rounded-full flex items-center justify-center"
>
  <svelte:component this={icon} />
</button>
