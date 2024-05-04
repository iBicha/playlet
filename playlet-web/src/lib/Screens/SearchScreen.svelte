<script lang="ts">
  // TODO:P1: Changing filters after doing a search should refresh the search restuls
  // TODO:P1: Investigate potential bug with the same page of search is repeated
  // TODO:P1: Make search textbox and filters sticky with the top bar

  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore, searchHistoryStore, tr } from "lib/Stores";
  import VideoCell from "lib/VideoFeed/VideoCell.svelte";
  import PlaylistCell from "lib/VideoFeed/PlaylistCell.svelte";
  import ChannelCell from "lib/VideoFeed/ChannelCell.svelte";
  import SearchThinIcon from "assets/search-thin-icon.svg.svelte";
  import FiltersIcon from "assets/filters.svg.svelte";
  import SearchFilters from "./Search/SearchFilters.svelte";

  export let visibility: boolean;

  let invidiousApi = new InvidiousApi();

  let searchBox;
  let searchBoxText = "";
  let suggestions: { suggestions: any[] } = { suggestions: [] };
  let page = 1;
  let videos = [];
  let searchHistory = [];
  let isLoading = false;

  let searchFiltersComponent;
  let searchFilters;
  let searchFiltersLabel;

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
    let userCountryCode = value?.device?.user_country_code;
    if (!userCountryCode || userCountryCode === "OT") {
      userCountryCode = "US";
    }
    invidiousApi.userCountryCode = userCountryCode;
  });

  searchHistoryStore.subscribe((value) => {
    searchHistory = value;
  });

  async function searchSuggestions(event) {
    const query = event.currentTarget.value;
    let newSuggestions;
    if (query.length === 0) {
      newSuggestions = { suggestions: [], query: "" };
    } else {
      newSuggestions = await invidiousApi.searchSuggestions(query);
    }

    // If we're late and the user walked away, no need for suggestions
    if (document.activeElement === searchBox) {
      // Check if this query is old or new
      if (searchBoxText === newSuggestions.query) {
        suggestions = makeSuggestionList(newSuggestions);
      }
    }
  }

  function makeSuggestionList(newSuggestions, maxItems = 10) {
    const matchingHistory = getSavedHistoryMatchingQuery(searchBoxText);
    const matchingHistoryAndSuggestions = [
      ...matchingHistory,
      ...newSuggestions.suggestions,
    ];
    const uniqueMatchingHistoryAndSuggestions = [
      ...new Set(matchingHistoryAndSuggestions),
    ];
    return {
      suggestions: uniqueMatchingHistoryAndSuggestions.slice(0, maxItems),
      query: newSuggestions.query,
    };
  }

  function getSavedHistoryMatchingQuery(query) {
    if (query.length === 0) {
      return searchHistory;
    }
    return searchHistory.filter((item) => item.startsWith(query));
  }

  async function suggestionClicked(query) {
    searchBoxText = query;
    page = 1;
    videos = [];
    await searchVideos();
  }

  async function searchVideos() {
    suggestions = { suggestions: [] };
    if (searchBoxText.length === 0) {
      return;
    }

    try {
      isLoading = true;
      const newVideos = await invidiousApi.search(
        searchBoxText,
        searchFilters,
        page
      );
      videos = [...videos, ...newVideos];
    } finally {
      isLoading = false;
    }

    if (page === 1) {
      const newSearchHistory = await PlayletApi.addSearchHistory(searchBoxText);
      searchHistoryStore.set(newSearchHistory);
    }
  }
</script>

<div class={visibility ? "" : "hidden"}>
  <div class="m-4">
    <!-- TODO:P2 use search HTML element -->
    <form
      on:submit={async (e) => {
        e.preventDefault();
        page = 1;
        videos = [];
        await searchVideos();
      }}
    >
      <div class="join w-full border border-neutral rounded-full">
        <input
          type="search"
          dir="auto"
          placeholder="{$tr('Search')}..."
          class="join-item input w-full border border-neutral rounded-full"
          bind:this={searchBox}
          bind:value={searchBoxText}
          on:input={searchSuggestions}
          on:focus={searchSuggestions}
          on:blur={() => {
            // A delay before clearing the suggestions allows the user to click on a suggestion
            // Clicking the suggestion will trigger the blur event immediately, and the search won't happen
            setTimeout(() => {
              suggestions = { suggestions: [] };
            }, 200);
          }}
        />
        <button
          class="join-item btn w-16"
          on:click={async () => {
            page = 1;
            videos = [];
            await searchVideos();
          }}
        >
          <div class="h-6">
            <SearchThinIcon />
          </div>
        </button>
      </div>
      <button
        class="btn border border-neutral rounded-full mt-1"
        on:click={searchFiltersComponent.show()}
      >
        <div class="h-6 w-8">
          <FiltersIcon />
        </div>
        {searchFiltersLabel}
      </button>

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
      class="grid grid-flow-row-dense gap-4 items-center justify-center sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 m-4"
    >
      {#each videos as video}
        {#if video.type === "video"}
          <VideoCell {...video} />
        {:else if video.type === "playlist"}
          <PlaylistCell {...video} />
        {:else if video.type === "channel"}
          <ChannelCell {...video} />
        {/if}
      {/each}
    </div>

    {#if !isLoading && videos.length > 0 && searchBoxText}
      <div class="flex justify-center items-center">
        <button
          class="btn w-1/2"
          on:click={async () => {
            page++;
            await searchVideos();
          }}
        >
          {$tr("Load more")}
        </button>
      </div>
    {/if}

    {#if isLoading}
      <div class="w-full h-1/2 z-50 flex justify-center items-center">
        <span class="loading loading-spinner loading-md" />
      </div>
    {/if}
  </div>

  <SearchFilters
    bind:this={searchFiltersComponent}
    bind:label={searchFiltersLabel}
    bind:filters={searchFilters}
  />
</div>
