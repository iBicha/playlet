<script lang="ts">
  export let checked = false;
  export let lengthSeconds = undefined;
  export let timestamp = 0;

  let textInputElemet;
  let timestampText = "";
  let timestampRange = 0;

  $: {
    if (document.activeElement !== textInputElemet) {
      timestampText = getTimeStampText(timestamp);
    }
  }

  $: timestampRange = timestamp !== undefined ? timestamp : 0;

  function getTimeStamp(timestampText) {
    if (timestampText === "") {
      return 0;
    }
    const match = /^(\d{1,3}):(\d{1,2})$/.exec(timestampText);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      if (seconds < 60) {
        return minutes * 60 + seconds;
      }
    }
  }

  function getTimeStampText(timestamp) {
    if (timestamp === undefined) {
      return "";
    }
    const minutes = Math.floor(timestamp / 60);
    const remainingSeconds = timestamp % 60;

    const formattedMinutes = String(minutes);
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
  }
</script>

<div class="form-control">
  <div class="flex flex-row items-center">
    <label class="label justify-start cursor-pointer">
      <input type="checkbox" bind:checked class="checkbox" />
      <span class="label-text m-2">Start at</span>
    </label>
    <input
      bind:this={textInputElemet}
      disabled={!checked}
      class="input w-24"
      placeholder="0:00"
      bind:value={timestampText}
      on:input={(e) => {
        timestamp = getTimeStamp(e.currentTarget.value);
      }}
    />
    {#if checked}
      {#if timestamp !== undefined}
        <span class="label-text m-2">({timestamp}s)</span>
      {:else}
        <span class="label-text m-2 text-error">(Invalid time)</span>
      {/if}
    {/if}
  </div>
  {#if lengthSeconds && checked}
    <input
      type="range"
      min="0"
      max={lengthSeconds}
      bind:value={timestampRange}
      on:input={(e) => {
        // @ts-ignore
        timestamp = e.currentTarget.value;
      }}
      class="range range-xs range-primary"
    />
  {/if}
</div>
