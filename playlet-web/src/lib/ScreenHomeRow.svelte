<script lang="ts">
  import { InvidiousApi } from "./InvidiousApi";
  import { invidiousVideoApiStore, playletStateStore } from "./Stores";
  import VideoCell from "./VideoCell.svelte";

  export let requestData: any = undefined;
  let invidiousApi = new InvidiousApi();

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
    updateRow();
  });

  let videos = undefined;

  invidiousVideoApiStore.subscribe((value) => {
    invidiousApi.endpoints = value;
    updateRow();
  });

  async function updateRow() {
    videos = await invidiousApi.makeRequest(requestData);
  }
</script>

{#if videos}
  <div>{requestData.title}</div>
  <div class="carousel carousel-center max-w-md p-4 space-x-4 bg-neutral rounded-box">
    {#each videos as video}
      <div class="carousel-item">
        <VideoCell {...video} />
      </div>
    {/each}
  </div>
{/if}
