<script lang="ts">
  import { onMount } from "svelte";
  import { InvidiousApi } from "./InvidiousApi";
  import { PlayletApi } from "./PlayletApi";
  import { playletStateStore, searchHistoryStore } from "./Stores";
  import VideoCell from "./VideoCell.svelte";

  export let visibility: boolean;

  let invidiousApi = new InvidiousApi();

  let searchBox;
  let searchBoxText = "";
  let suggestions: { suggestions: any[] } = { suggestions: [] };
  let videos = [];
  let searchHistory = [];

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
    invidiousApi.userCountryCode = value?.device?.user_country_code ?? "US";
  });

  searchHistoryStore.subscribe((value) => {
    searchHistory = value;
  });

  onMount(async () => {
    const currentSearchHistory = await PlayletApi.getSearchHistory();
    searchHistoryStore.set(currentSearchHistory);
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
    await searchVideos();
  }

  async function searchVideos() {
    suggestions = { suggestions: [] };
    videos = [];
    if (searchBoxText.length === 0) {
      return;
    }

    videos = await invidiousApi.search(searchBoxText);
    const newSearchHistory = await PlayletApi.putSearchHistory(searchBoxText);
    searchHistoryStore.set(newSearchHistory);
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
        on:focus={searchSuggestions}
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
      class="grid grid-flow-row-dense gap-4 items-center justify-center sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 m-4"
    >
      {#each videos as video}
        {#if video.type === "video"}
          <VideoCell {...video} />
        {/if}
      {/each}
    </div>
  </div>
</div>
