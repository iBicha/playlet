<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { playletStateStore } from "lib/Stores";
  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import VideoCastDialog from "./VideoFeed/VideoCastDialog.svelte";
  import ChannelCastDialog from "./VideoFeed/ChannelCastDialog.svelte";
  import { YoutubeJs } from "./Api/YoutubeJs";

  let videoModal;
  let channelModal;
  let isDragging;
  let isLoading;
  let dragEndTimeout;

  let videoStartAtChecked;
  let videoStartAtTimestamp;

  let videoMetadata;
  let channelMetadata;

  let tvName = "Roku TV";
  let invidiousInstance;

  let invidiousApi = new InvidiousApi();

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
    invidiousApi.instance = invidiousInstance =
      value?.invidious?.current_instance;
  });

  onMount(async () => {
    document.body.addEventListener("drop", onDrop);
    document.body.addEventListener("dragover", onDragOver);
    document.body.addEventListener("paste", onPaste);
  });

  onDestroy(() => {
    document.body.removeEventListener("drop", onDrop);
    document.body.removeEventListener("dragover", onDragOver);
    document.body.removeEventListener("paste", onPaste);
  });

  async function onPaste(event) {
    closeModal();

    const dataString = event.clipboardData.getData("text/plain");
    await processUrlText(dataString);
  }

  async function onDrop(event) {
    event.preventDefault();
    closeModal();

    isDragging = false;
    for (var i in event.dataTransfer.items) {
      let item = event.dataTransfer.items[i];
      if (item.kind === "string" && item.getAsString) {
        let dataString = (await new Promise((resolve) =>
          item.getAsString(resolve)
        )) as string;
        await processUrlText(dataString);
      }
    }
  }

  async function processUrlText(dataString: string) {
    try {
      isLoading = true;

      if (isValidHttpUrl(dataString)) {
        let urlInfo = await YoutubeJs.resolveUrl(dataString);
        if (urlInfo.ucid) {
          await searchForChannelById(urlInfo.ucid);
        } else if (urlInfo.videoId) {
          await searchForVideoById(urlInfo.videoId, urlInfo.timestamp);
        } else {
          // If the urls are not from Youtube, they could be from Invidious
          urlInfo = parseYouTubeLikeUrl(dataString);
          if (urlInfo.videoId) {
            await searchForVideoById(urlInfo.videoId, urlInfo.timestamp);
          }
        }
      }
    } finally {
      isLoading = false;
    }
  }

  async function searchForVideoById(videoId, timestamp) {
    videoMetadata = await invidiousApi.getVideoMetadata(videoId);
    videoStartAtChecked = timestamp !== undefined;
    if (videoStartAtChecked) {
      videoStartAtTimestamp = timestamp;
    }
    videoModal.show();
  }

  async function searchForChannelById(channelId) {
    channelMetadata = await invidiousApi.getChannelMetadata(channelId);
    channelModal.show();
  }

  function onDragOver(event) {
    closeModal();
    clearTimeout(dragEndTimeout);
    dragEndTimeout = setTimeout(() => {
      isDragging = false;
    }, 200);
    isDragging = true;
    event.preventDefault();
  }

  function isValidHttpUrl(url) {
    if (!url) {
      return false;
    }
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (_) {
      return false;
    }
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  }

  function parseYouTubeLikeUrl(url) {
    const urlSearchParams = new URLSearchParams(new URL(url).search);

    const result: any = {
      videoId: urlSearchParams.get("v"),
      timestamp: urlSearchParams.get("t"),
    };

    if (result.timestamp && result.timestamp.endsWith("s")) {
      result.timestamp = result.timestamp.slice(0, -1);
    }

    return result;
  }

  function closeModal() {
    videoModal?.close();
    channelModal?.close();
    videoMetadata = undefined;
    channelMetadata = undefined;
  }
</script>

<div
  class="{isDragging || isLoading
    ? ''
    : 'hidden'} fixed w-full h-full bg-base-100/80 z-50 flex justify-center items-center"
>
  {#if isDragging}
    <div class="text-2xl font-bold">Drop a Youtube link here</div>
  {:else if isLoading}
    <span class="loading loading-spinner loading-md" />
  {/if}
</div>

<VideoCastDialog
  bind:this={videoModal}
  videoId={videoMetadata?.videoId}
  title={videoMetadata?.title}
  videoThumbnails={videoMetadata?.videoThumbnails}
  author={videoMetadata?.author}
  lengthSeconds={videoMetadata?.lengthSeconds}
  liveNow={videoMetadata?.liveNow}
  viewCount={videoMetadata?.viewCount}
  bind:videoStartAtChecked
  bind:videoStartAtTimestamp
/>

<ChannelCastDialog
  bind:this={channelModal}
  author={channelMetadata?.author}
  authorId={channelMetadata?.authorId}
  authorThumbnails={channelMetadata?.authorThumbnails}
/>
