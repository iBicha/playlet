<script lang="ts">
  import { InvidiousApi } from "./InvidiousApi";
  import { invidiousVideoApiStore, playletStateStore } from "./Stores";
  import VideoCell from "./VideoCell.svelte";

  export let requestData: any = undefined;
  export let videoRowData = undefined;

  let carouselElement;

  let scrollStart = 0;
  let scrollEnd = 0;

  // w-80 p-2: 320px + 16px padding on each side
  const itemWidth = 320 + 16 * 2;

  $: {
    if (videoRowData && !Array.isArray(videoRowData)) {
      if (
        carouselElement &&
        videoRowData.videos &&
        videoRowData.videos.length
      ) {
        recalculateVisibileCells();
      }
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
      videoRowData = result;
    }
  }

  function recalculateVisibileCells() {
    const scrollLeft = carouselElement.scrollLeft;
    const clientWidth = carouselElement.clientWidth || window.innerWidth;

    scrollStart = Math.floor(scrollLeft / itemWidth) - 1;
    scrollEnd = Math.ceil((scrollLeft + clientWidth) / itemWidth) + 1;
  }
</script>

{#if videoRowData}
  {#if Array.isArray(videoRowData)}
    {#each videoRowData as child}
      <svelte:self videoRowData={child} />
    {/each}
  {:else if videoRowData.title && videoRowData.videos}
    <div class="text-lg font-semibold m-4">
      {videoRowData.title}
    </div>
    <div
      class="carousel carousel-center rounded-box w-full space-x-4"
      bind:this={carouselElement}
      on:scroll={recalculateVisibileCells}
    >
      {#each videoRowData.videos as video, i}
        <div class="carousel-item w-80 p-2">
          {#if i >= scrollStart && i <= scrollEnd}
            <VideoCell {...video} />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}
