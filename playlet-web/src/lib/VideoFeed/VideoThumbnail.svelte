<script lang="ts">
  import { translate } from "lib/Stores";

  export let videoId: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let videoThumbnails: any[] | undefined = undefined;
  export let liveNow: boolean = undefined;
  export let lengthSeconds: number = undefined;
  export let lengthText: string | undefined = undefined;
  export let viewCount: number | undefined = undefined;
  export let isUpcoming: boolean | undefined = undefined;
  export let premiereTimestamp: number | undefined = undefined;
  export let percentDurationWatched: number | undefined = undefined;

  export let invidiousInstance;

  let thumbnailUrl;

  $: {
    if (videoThumbnails && videoThumbnails.length > 0) {
      const videoThumbnail =
        videoThumbnails.find((thumbnail) => thumbnail.quality === "medium") ||
        videoThumbnails[0];
      let url = videoThumbnail.url;
      if (url.startsWith("/")) {
        if (
          invidiousInstance &&
          !invidiousInstance.includes(":8888/playlet-invidious-backend")
        ) {
          url = invidiousInstance + url;
        } else {
          url = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
        }
      }
      thumbnailUrl = url;
    } else if (invidiousInstance) {
      thumbnailUrl = `${invidiousInstance}/vi/${videoId || "--"}/mqdefault.jpg`;
    }
  }

  function getFormattedTime(text, length) {
    if (text) {
      return text;
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

  function isVideoLive() {
    if (liveNow) {
      return true;
    }
    return lengthSeconds === 0 && viewCount === 0;
  }

  function isVideoUpcoming() {
    return isUpcoming && !!premiereTimestamp;
  }
</script>

<figure class="relative">
  <img
    class="w-full rounded-box aspect-video object-cover"
    loading="lazy"
    width="320"
    height="180"
    src={thumbnailUrl}
    alt={title}
  />
  {#if isVideoUpcoming()}
    <div
      class="absolute bottom-2 right-0 bg-black/70 text-white text-sm rounded-sm font-bold pt-1 pb-1 pr-2 pl-2"
    >
      {$translate("UPCOMING")}
    </div>
  {:else if isVideoLive()}
    <div
      class="absolute bottom-2 right-0 bg-red-500 text-white text-sm rounded-sm font-bold pt-1 pb-1 pr-2 pl-2"
    >
      {$translate("LIVE")}
    </div>
  {:else if lengthSeconds || lengthText}
    <div
      class="absolute bottom-2 right-0 bg-black/70 text-white text-sm rounded-sm pt-1 pb-1 pr-2 pl-2"
    >
      {getFormattedTime(lengthText, lengthSeconds)}
    </div>
  {/if}
  {#if percentDurationWatched}
    <div
      class="absolute left-0 bottom-0 h-1 bg-red-600 rounded-box"
      style="width: {Math.min(percentDurationWatched, 100)}%;"
    ></div>
  {/if}
</figure>
