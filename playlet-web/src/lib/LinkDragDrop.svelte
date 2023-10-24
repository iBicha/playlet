<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore } from "lib/Stores";
  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import VideoStartAt from "lib/VideoStartAt.svelte";

  let modal;
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
  });

  onDestroy(() => {
    document.body.removeEventListener("drop", onDrop);
    document.body.removeEventListener("dragover", onDragOver);
  });

  async function onDrop(event) {
    event.preventDefault();
    modal.close();

    isDragging = false;
    for (var i in event.dataTransfer.items) {
      let item = event.dataTransfer.items[i];
      if (item.kind === "string" && item.getAsString) {
        let dataString = (await new Promise((resolve) =>
          item.getAsString(resolve)
        )) as string;
        if (isValidHttpUrl(dataString)) {
          const videoInfo = parseYouTubeUrl(dataString);
          if (videoInfo.videoId) {
            searchForVideoById(videoInfo.videoId, videoInfo.timestamp);
            return;
          } else {
            const urlInfo: any = await invidiousApi.resolveUrl(dataString);
            if (urlInfo && urlInfo.pageType === "WEB_PAGE_TYPE_CHANNEL") {
              searchForChannelById(urlInfo.ucid);
              return;
            }
          }
        }
      }
    }
  }

  async function searchForVideoById(videoId, timestamp) {
    try {
      isLoading = true;
      videoMetadata = await invidiousApi.getVideoMetadata(videoId);
      videoStartAtChecked = timestamp !== undefined;
      if (videoStartAtChecked) {
        videoStartAtTimestamp = timestamp;
      }
      modal.showModal();
    } finally {
      isLoading = false;
    }
  }

  async function searchForChannelById(channelId) {
    try {
      isLoading = true;
      channelMetadata = await invidiousApi.getChannelMetadata(channelId);
      modal.showModal();
    } finally {
      isLoading = false;
    }
  }

  function onDragOver(event) {
    modal.close();
    clearTimeout(dragEndTimeout);
    dragEndTimeout = setTimeout(() => {
      isDragging = false;
    }, 200);
    isDragging = true;
    event.preventDefault();
  }

  function isValidHttpUrl(string) {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
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

  async function playVideoOnTv() {
    await PlayletApi.playVideo(
      videoMetadata?.videoId,
      videoStartAtTimestamp,
      videoMetadata?.title,
      videoMetadata?.author
    );
  }
  async function queueVideoOnTv() {
    await PlayletApi.queueVideo(
      videoMetadata?.videoId,
      videoStartAtTimestamp,
      videoMetadata?.title,
      videoMetadata?.author
    );
  }

  async function openChannelOnTv() {
    await PlayletApi.openChannel(channelMetadata?.authorId);
  }

  function openVideoInvidiousInNewTab() {
    let url = `${invidiousInstance}/watch?v=${videoMetadata?.videoId}`;
    if (videoStartAtChecked && videoStartAtTimestamp) {
      url += `&t=${videoStartAtTimestamp}`;
    }
    window.open(url);
  }

  function openChannelInvidiousInNewTab() {
    let url = `${invidiousInstance}/channel/${channelMetadata?.authorId}`;
    window.open(url);
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

<dialog bind:this={modal} id="modal_video_drag_drop" class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    {#if videoMetadata}
      <h3 class="text-lg m-5">{videoMetadata.title}</h3>
      <div class="flex flex-col">
        <VideoStartAt
          bind:checked={videoStartAtChecked}
          bind:timestamp={videoStartAtTimestamp}
          lengthSeconds={videoMetadata.lengthSeconds}
        />
        <button class="btn m-2" on:click={playVideoOnTv}>
          Play on {tvName}
        </button>
        <button class="btn m-2" on:click={queueVideoOnTv}>
          Queue on {tvName}
        </button>
        <button class="btn m-2" on:click={openVideoInvidiousInNewTab}>
          Open in Invidious
        </button>
      </div>
    {:else if channelMetadata}
      <h3 class="text-lg m-5">{channelMetadata.author}</h3>
      <div class="text-sm m-5 line-clamp-3">{channelMetadata.description}</div>
      <button class="btn m-2" on:click={openChannelOnTv}>
        Open on {tvName}
      </button>
      <button class="btn m-2" on:click={openChannelInvidiousInNewTab}>
        Open in Invidious
      </button>
    {:else}
      <span class="loading loading-spinner loading-md" />
    {/if}
    <button class="btn m-2">Cancel</button>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
