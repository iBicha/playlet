<script lang="ts">
  import { InvidiousApi } from "./InvidiousApi";
  import { playletStateStore } from "./Stores";
  import VideoCell from "./VideoCell.svelte";

  let invidiousApi = new InvidiousApi();
  let videos = [];
  let suggestions: {suggestions: any[]} = {suggestions: []};

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
  });

  async function searchSuggestions(event) {
    const query = event.currentTarget.value;
    if (query.length === 0) {
      suggestions = {suggestions: []};
      return;
    }
    suggestions = await invidiousApi.searchSuggestions(query);
  }

  async function searchVideos(event) {
    videos = [];
    const query = event.currentTarget.value;
    videos = await invidiousApi.search(query);
  }
</script>

<div>
  <input
    type="search"
    placeholder="Search..."
    class="input w-full max-w-xs"
    on:input={searchSuggestions}
    on:change={searchVideos}
  />
  <div
    id="dropdown"
    class="absolute z-10 w-full mt-2 py-1 rounded-md shadow-lg"
  >
    <ul
      tabindex="-1"
      class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
    >
      {#each suggestions.suggestions as suggestion}
        <li>{suggestion}</li>
       {/each}
    </ul>
  </div>
</div>

<div>
  {#each videos as video}
    {#if video.type === "video"}
      <VideoCell {...video} />
    {/if}
  {/each}
</div>
