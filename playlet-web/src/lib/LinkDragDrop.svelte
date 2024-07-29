<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { playletStateStore, tr } from "lib/Stores";
  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import VideoCastDialog from "./VideoFeed/VideoCastDialog.svelte";
  import ChannelCastDialog from "./VideoFeed/ChannelCastDialog.svelte";

  let videoModal;
  let channelModal;
  let isDragging;
  let isLoading;
  let dragEndTimeout;

  let videoStartAtChecked;
  let videoStartAtTimestamp;

  let videoMetadata;
  let channelMetadata;

  let invidiousApi = new InvidiousApi();

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
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
    if (isValidHttpUrl(dataString)) {
      const videoInfo = parseYouTubeUrl(dataString);
      if (videoInfo.videoId) {
        searchForVideoById(videoInfo.videoId, videoInfo.timestamp);
        return;
      } else {
        // TODO:P2 make a HEAD request and check for a redirect, then
        // resolve the redirect url.
        const urlInfo: any = await invidiousApi.resolveUrl(dataString);
        if (urlInfo && urlInfo.pageType === "WEB_PAGE_TYPE_CHANNEL") {
          searchForChannelById(urlInfo.ucid);
          return;
        }
      }
    }
  }

  async function searchForVideoById(videoId, timestamp) {
    try {
      isLoading = true;
      videoMetadata = await invidiousApi.getVideoMetadata(videoId, false);
      videoStartAtChecked = timestamp !== undefined;
      if (videoStartAtChecked) {
        videoStartAtTimestamp = timestamp;
      }
      videoModal.show();
    } finally {
      isLoading = false;
    }
  }

  async function searchForChannelById(channelId) {
    try {
      isLoading = true;
      channelMetadata = await invidiousApi.getChannelMetadata(channelId);
      channelModal.show();
    } finally {
      isLoading = false;
    }
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

  function parseYouTubeUrl(url) {
    const urlSearchParams = new URLSearchParams(new URL(url).search);

    function getTimestamp() {
      const timestamp = urlSearchParams.get("t");
      if (timestamp) {
        return timestamp.endsWith("s") ? timestamp.slice(0, -1) : timestamp;
      }
    }

    // Share/Short url
    const YoutubeUrls = [
      "https://youtu.be/",
      "http://youtu.be/",
      "https://www.youtu.be/",
      "http://www.youtu.be/",
      "https://youtube.com/shorts/",
      "http://youtube.com/shorts/",
      "https://www.youtube.com/shorts/",
      "http://www.youtube.com/shorts/",
      "https://youtube.com/live/",
      "http://youtube.com/live/",
      "https://www.youtube.com/live/",
      "http://www.youtube.com/live/",
    ];
    for (var i in YoutubeUrls) {
      let youtubeUrl = YoutubeUrls[i];
      if (url.startsWith(youtubeUrl)) {
        let videoId = url.replace(youtubeUrl, "");
        if (videoId.includes("?")) {
          videoId = videoId.substring(0, videoId.indexOf("?"));
        }
        const result: any = {
          videoId,
        };

        const timestamp = getTimestamp();
        if (timestamp) {
          result.timestamp = timestamp;
        }
        return result;
      }
    }

    // regular url
    const result: any = {
      videoId: urlSearchParams.get("v"),
    };

    const timestamp = getTimestamp();
    if (timestamp) {
      result.timestamp = timestamp;
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
    <div class="text-2xl font-bold">{$tr("Drop a YouTube link here")}</div>
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
  isUpcoming={videoMetadata?.isUpcoming}
  premiereTimestamp={videoMetadata?.premiereTimestamp}
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
