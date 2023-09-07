<script lang="ts">
  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import { invidiousVideoApiStore, playletStateStore } from "lib/Stores";
  import VideoCell from "lib/Screens/Home/VideoCell.svelte";
  import PlaylistCell from "lib/Screens/Home/PlaylistCell.svelte";

  export let requestData: any = undefined;
  export let videos = undefined;

  let carouselElement;

  let scrollStart = 0;
  let scrollEnd = 0;

  // w-80 p-2: 320px + 16px padding on each side
  const itemWidth = 320 + 16 * 2;

  $: {
    if (carouselElement && videos && videos.length) {
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
    if (result) {
      result.forEach((item) => {
        if (item.videoId) {
          item.type = "video";
        } else if (item.playlistId) {
          item.type = "playlist";
        }
      });
      videos = result.filter(
        (video) => video.type === "video" || video.type === "playlist"
      );
    }
  }

  function recalculateVisibileCells() {
    const scrollLeft = carouselElement.scrollLeft;
    const clientWidth = carouselElement.clientWidth || window.innerWidth;

    scrollStart = Math.floor(scrollLeft / itemWidth) - 1;
    scrollEnd = Math.ceil((scrollLeft + clientWidth) / itemWidth) + 1;
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
      <div class="carousel-item w-80 p-2">
        {#if i >= scrollStart && i <= scrollEnd}
          {#if video.type === "video"}
            <VideoCell {...video} />
          {:else if video.type === "playlist"}
            <PlaylistCell {...video} />
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}
