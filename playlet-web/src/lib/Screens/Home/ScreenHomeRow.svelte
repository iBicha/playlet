<script lang="ts">
  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import { invidiousVideoApiStore, playletStateStore } from "lib/Stores";
  import VideoCell from "lib/Screens/Home/VideoCell.svelte";
  import PlaylistCell from "lib/Screens/Home/PlaylistCell.svelte";
  import ChannelCell from "./ChannelCell.svelte";

  export let requestData: any = undefined;
  export let videos = undefined;

  let itemWidths = [];

  let carouselElement;

  let scrollStart = 0;
  let scrollEnd = 0;

  // w-80|w-60 p-2: 320px|240px + 16px padding on each side
  const videoItemWidth = 320 + 16 * 2;
  const channelItemWidth = 240 + 16 * 2;

  $: {
    if (carouselElement && itemWidths && itemWidths.length) {
      recalculateVisibileCells();
    }
  }

  let invidiousApi = new InvidiousApi();

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
    invidiousApi.userCountryCode = value?.device?.user_country_code ?? "US";
    invidiousApi.isLoggedIn = value.invidious?.logged_in ?? false;
    updateRow();
  });

  invidiousVideoApiStore.subscribe((value) => {
    invidiousApi.endpoints = value;
    updateRow();
  });

  async function updateRow() {
    const result = await invidiousApi.makeRequest(requestData);
    if (result && result.items) {
      result.items.forEach((item) => {
        if (item.videoId) {
          item.type = "video";
        } else if (item.playlistId) {
          item.type = "playlist";
        }
      });
      videos = result.items;
      itemWidths = videos.map((video) => {
        if (video.type === "channel") {
          return channelItemWidth;
        } else {
          return videoItemWidth;
        }
      });
    }
  }

  function recalculateVisibileCells() {
    let scrollLeft = carouselElement.scrollLeft;
    const clientWidth = carouselElement.clientWidth || window.innerWidth;

    scrollStart = 0;
    while (
      scrollStart < itemWidths.length &&
      scrollLeft > itemWidths[scrollStart]
    ) {
      scrollLeft -= itemWidths[scrollStart];
      scrollStart++;
    }

    scrollEnd = scrollStart;
    while (
      scrollEnd < itemWidths.length &&
      scrollLeft + clientWidth > itemWidths[scrollEnd]
    ) {
      scrollLeft -= itemWidths[scrollEnd];
      scrollEnd++;
    }

    scrollStart = Math.max(0, scrollStart - 1);
    scrollEnd = Math.min(itemWidths.length - 1, scrollEnd + 1);
  }
</script>

{#if videos}
  <div class="text-lg font-semibold m-4">
    {requestData.title}
  </div>
  <div
    class="carousel carousel-center rounded-box w-full space-x-4"
    bind:this={carouselElement}
    on:scroll={recalculateVisibileCells}
  >
    {#each videos as video, i}
      <div
        class="carousel-item {video.type === 'channel' ? 'w-60' : 'w-80'} p-2"
      >
        {#if i >= scrollStart && i <= scrollEnd}
          {#if video.type === "video"}
            <VideoCell {...video} />
          {:else if video.type === "playlist"}
            <PlaylistCell {...video} />
          {:else if video.type === "channel"}
            <ChannelCell {...video} />
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}
