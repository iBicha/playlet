<script lang="ts">
  import { InvidiousApi } from "./InvidiousApi";
  import {
    invidiousVideoApiStore,
    playletStateStore,
  } from "./Stores";
  import VideoCell from "./VideoCell.svelte";

  export let requestData: any = undefined;
  export let videoRowData = undefined;

  let invidiousApi = new InvidiousApi();

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
    invidiousApi.userCountryCode = value?.app?.user_country_code ?? "US";
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
</script>

{#if videoRowData}
  {#if Array.isArray(videoRowData)}
    {#each videoRowData as child}
      <svelte:self videoRowData={child} />
    {/each}
  {:else if videoRowData.title && videoRowData.videos}
    <div class="text-lg font-semibold m-4">{videoRowData.title}</div>
    <div
      class="carousel carousel-center rounded-box w-full space-x-4"
    >
      {#each videoRowData.videos as video}
        <div class="carousel-item">
          <VideoCell {...video} />
        </div>
      {/each}
    </div>
  {/if}
{/if}
