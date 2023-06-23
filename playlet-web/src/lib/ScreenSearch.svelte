<script lang="ts">
  import { InvidiousApi } from "./InvidiousApi";
  import { playletStateStore } from "./Stores";
  import VideoCell from "./VideoCell.svelte";

  export let visibility: boolean;

  let invidiousApi = new InvidiousApi();

  let searchBox;
  let searchBoxText = "";
  let suggestions: { suggestions: any[] } = { suggestions: [] };
  let videos = [];

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
    invidiousApi.userCountryCode = value?.app?.user_country_code ?? "US";
  });

  async function searchSuggestions(event) {
    const query = event.currentTarget.value;
    if (query.length === 0) {
      suggestions = { suggestions: [] };
      return;
    }
    const newSuggestions = await invidiousApi.searchSuggestions(query);
    // If we're late and the user walked away, no need for suggestions
    if (document.activeElement === searchBox) {
      suggestions = newSuggestions;
    }
  }

  async function suggestionClicked(query) {
    searchBoxText = query;
    await searchVideos();
  }

  async function searchVideos() {
    suggestions = { suggestions: [] };
    videos = [];
    if (searchBoxText.length === 0) {
      return;
    }

    videos = await invidiousApi.search(searchBoxText);
  }
</script>

<div class={visibility ? "" : "hidden"}>
  <div class="m-4">
    <form
      on:submit={async (e) => {
        e.preventDefault();
        await searchVideos();
      }}
    >
      <input
        type="search"
        dir="auto"
        placeholder="Search..."
        class="input w-full border border-neutral rounded-full"
        bind:this={searchBox}
        bind:value={searchBoxText}
        on:input={searchSuggestions}
        on:blur={() => {
          // A delay before clearing the suggestions allows the user to click on a suggestion
          // Clicking the suggestion will trigger the blur event immediately, and the search won't happen
          setTimeout(() => {
            suggestions = { suggestions: [] };
          }, 200);
        }}
      />
      {#if suggestions.suggestions.length > 0}
        <ul
          class="dropdown-content menu z-10 p-2 shadow-xl bg-base-200 rounded-box"
        >
          {#each suggestions.suggestions as suggestion}
            <li class="p-1">
              <button
                type="button"
                on:click={async (e) => {
                  await suggestionClicked(e.currentTarget.innerText);
                }}>{@html suggestion}</button
              >
            </li>
          {/each}
        </ul>
      {/if}
    </form>
  </div>

  <div>
    <div
      class="grid grid-flow-row-dense gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
    >
      {#each videos as video}
        {#if video.type === "video"}
          <VideoCell {...video} />
        {/if}
      {/each}
    </div>
  </div>
</div>
