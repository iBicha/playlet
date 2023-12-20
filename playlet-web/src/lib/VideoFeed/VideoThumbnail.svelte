<script lang="ts">
  export let videoId: string | undefined = undefined;
  export let title: string | undefined = undefined;
  export let videoThumbnails: any[] | undefined = undefined;
  export let liveNow: boolean = undefined;
  export let lengthSeconds: number = undefined;
  export let viewCount: number | undefined = undefined;

  export let invidiousInstance;

  let thumbnailUrl;

  $: {
    if (videoThumbnails && videoThumbnails.length > 0) {
      const videoThumbnail =
        videoThumbnails.find((thumbnail) => thumbnail.quality === "medium") ||
        videoThumbnails[0];
      let url = videoThumbnail.url;
      if (url.startsWith("/") && invidiousInstance) {
        url = invidiousInstance + url;
      }
      thumbnailUrl = url;
    } else if (invidiousInstance) {
      thumbnailUrl = `${invidiousInstance}/vi/${videoId || "--"}/mqdefault.jpg`;
    }
  }

  function getFormattedTime(length) {
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
  {#if isVideoLive()}
    <div
      class="absolute bottom-2 right-0 bg-red-500 text-white text-sm rounded-sm font-bold pt-1 pb-1 pr-2 pl-2"
    >
      LIVE
    </div>
  {:else if lengthSeconds}
    <div
      class="absolute bottom-2 right-0 bg-black/70 text-white text-sm rounded-sm pt-1 pb-1 pr-2 pl-2"
    >
      {getFormattedTime(lengthSeconds)}
    </div>
  {/if}
</figure>
