<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { PlayletApi } from "./PlayletApi";
  import { playletStateStore } from "./Stores";
  import { InvidiousApi } from "./InvidiousApi";
  import VideoStartAt from "./VideoStartAt.svelte";

  let modal;
  let isDragging;
  let isLoading;
  let dragEndTimeout;

  let videoStartAtChecked;
  let videoStartAtTimestamp;

  let videoMetadata;

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
        let dataString = await new Promise((resolve) =>
          item.getAsString(resolve)
        );
        if (isValidHttpUrl(dataString)) {
          const videoInfo = parseYouTubeUrl(dataString);
          if (videoInfo.videoId) {
            console.log(videoInfo);
            searchForVideoById(videoInfo.videoId, videoInfo.timestamp);
            return;
          }
        }
      }
    }
  }

  async function searchForVideoById(videoId, timestamp) {
    try {
      isLoading = true;
      videoMetadata = await invidiousApi.getVideoMetadata(videoId);
      videoStartAtTimestamp = timestamp;
      videoStartAtChecked = videoStartAtTimestamp !== undefined;
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

    function getTimestamp(){
      const timestamp = urlSearchParams.get("t");
      if (timestamp) {
        return timestamp.endsWith("s")
          ? timestamp.slice(0, -1)
          : timestamp;
      }
    }

    // Share/Short url
    // TODO: use regex, and support timestamped videos
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
      result.timestamp = timestamp
    }

    return result;
  }

  async function playVideoOnTv() {
    await PlayletApi.playVideo(videoMetadata?.videoId, videoStartAtTimestamp);
  }

  function openInvidiousInNewTab() {
    let url = `${invidiousInstance}/watch?v=${videoMetadata?.videoId}`;
    if (videoStartAtChecked && videoStartAtTimestamp) {
      url += `&t=${videoStartAtTimestamp}`;
    }
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
    <h3 class="text-lg m-5">{videoMetadata?.title}</h3>
    <div class="flex flex-col">
      <VideoStartAt
        bind:checked={videoStartAtChecked}
        bind:timestamp={videoStartAtTimestamp}
        lengthSeconds={videoMetadata?.lengthSeconds}
      />
      <button class="btn m-2" on:click={playVideoOnTv}>Play on {tvName}</button>
      <button class="btn m-2" on:click={openInvidiousInNewTab}
        >Open in Invidious</button
      >
      <button class="btn m-2">Cancel</button>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
