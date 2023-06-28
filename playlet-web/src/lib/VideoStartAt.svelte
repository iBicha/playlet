<script lang="ts">
  export let checked = false;
  export let lengthSeconds = undefined;
  export let timestamp = 0;

  let textInputElemet;
  let timestampText = "";
  let timestampRange = 0;

  $: {
    if (document.activeElement !== textInputElemet) {
      timestampText = getFormattedTime(timestamp);
    }
  }

  $: timestampRange = timestamp !== undefined ? timestamp : 0;

  function getTimeStamp(timestampText) {
    if (timestampText === "") {
      return 0;
    }

    const match = /^((\d+):)?(\d{1,2}):(\d{1,2})$/.exec(timestampText);
    if (match) {
      const hours = match[2] ? parseInt(match[2]) : 0;
      const minutes = parseInt(match[3]);
      const seconds = parseInt(match[4]);

      if (minutes < 60 && seconds < 60) {
        return hours * 3600 + minutes * 60 + seconds;
      }
    }
  }

  function getFormattedTime(length) {
    if (length === undefined) {
      return undefined;
    }
    const hours = Math.floor(length / 3600);
    const minutes = Math.floor((length / 60) % 60);
    const seconds = length % 60;

    const secondsString = seconds < 10 ? `0${seconds}` : seconds.toString();
    const minutesString =
      minutes < 10 && hours > 0 ? `0${minutes}` : minutes.toString();

    let formattedTime = minutesString + ":" + secondsString;

    if (hours > 0) {
      formattedTime = hours.toString() + ":" + formattedTime;
    }

    return formattedTime;
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
      class="input w-28"
      placeholder="0:00"
      bind:value={timestampText}
      on:input={(e) => {
        let newTimestamp = getTimeStamp(e.currentTarget.value);
        if (newTimestamp !== undefined && lengthSeconds) {
          newTimestamp = Math.min(newTimestamp, lengthSeconds);
        }
        timestamp = newTimestamp;
      }}
      on:change={(e) => {
        timestampText = getFormattedTime(timestamp) ?? "0:00";
        timestamp = getTimeStamp(timestampText);
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
