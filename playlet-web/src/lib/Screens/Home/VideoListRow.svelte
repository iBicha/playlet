<script lang="ts">
  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import { invidiousVideoApiStore, playletStateStore } from "lib/Stores";
  import VideoCell from "lib/Screens/Home/VideoCell.svelte";
  import PlaylistCell from "lib/Screens/Home/PlaylistCell.svelte";
  import ChannelCell from "./ChannelCell.svelte";

  export let feed: any = undefined;
  export let videos = undefined;

  enum FeedLoadState {
    None,
    Loading,
    Loaded,
    LoadedPage,
    Error,
  }

  let feedLoadState = FeedLoadState.None;
  let feedSourcesIndex = 0;

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

  $: {
    if (videos && scrollEnd >= videos.length - 1) {
      loadRow();
    }
  }

  let invidiousApi = new InvidiousApi();

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
    invidiousApi.userCountryCode = value?.device?.user_country_code ?? "US";
    invidiousApi.isLoggedIn = value.invidious?.logged_in ?? false;
    loadRow();
  });

  invidiousVideoApiStore.subscribe((value) => {
    invidiousApi.endpoints = value;
    loadRow();
  });

  async function loadRow() {
    if (!invidiousApi.canMakeRequest()) {
      return;
    }

    if (
      feedLoadState === FeedLoadState.Loading ||
      feedLoadState === FeedLoadState.Loaded
    ) {
      return;
    }

    feedLoadState = FeedLoadState.Loading;

    let totalFetchedItems = 0;

    while (true) {
      const feedSources = feed.feedSources;
      if (feedSourcesIndex >= feedSources.length) {
        break;
      }

      const feedSource = feedSources[feedSourcesIndex];
      feedSource.state = feedSource.state || {};
      if (
        feedSource.state.loadState === FeedLoadState.Loaded ||
        feedSource.state.loadState === FeedLoadState.Error
      ) {
        feedSourcesIndex++;
        continue;
      }

      invidiousApi.markFeedSourcePagination(feedSource);

      try {
        const result = await invidiousApi.makeRequest(feedSource);
        if (!result) {
          return;
        }

        const hasContinuation = !!result.continuation;
        if (hasContinuation) {
          feedSource.state.continuation = result.continuation;
        }

        if (result.items.length > 0) {
          const paginationType = feedSource.state.paginationType;
          if (paginationType === "Continuation" && hasContinuation) {
            feedSource.state.loadState = FeedLoadState.LoadedPage;
          } else if (paginationType === "Pages") {
            feedSource.state.loadState = FeedLoadState.LoadedPage;
          } else {
            feedSource.state.loadState = FeedLoadState.Loaded;
          }
        } else {
          feedSource.state.loadState = FeedLoadState.Loaded;
        }

        if (
          feedSource.state.loadState === FeedLoadState.Loaded &&
          feedSourcesIndex === feedSources.length - 1
        ) {
          feedLoadState = FeedLoadState.Loaded;
        } else {
          feedLoadState = FeedLoadState.LoadedPage;
        }

        if (result && result.items) {
          const newVideos = result.items;

          newVideos.forEach((item) => {
            if (item.videoId) {
              item.type = "video";
            } else if (item.playlistId) {
              item.type = "playlist";
            }
          });

          const newItemWidths = newVideos.map((video) => {
            if (video.type === "channel") {
              return channelItemWidth;
            } else {
              return videoItemWidth;
            }
          });

          itemWidths = [...itemWidths, ...newItemWidths];
          videos = [...(videos || []), ...newVideos];

          totalFetchedItems += result.items.length;
          if (totalFetchedItems >= 3) {
            break;
          }
        }
      } catch (error) {
        console.error(error);
        feedSource.state.loadState = FeedLoadState.Error;
      }
    }
  }

  function recalculateVisibileCells() {
    let scrollLeft = carouselElement.scrollLeft;
    const clientWidth = carouselElement.clientWidth || window.innerWidth;

    let _scrollStart = 0;
    while (
      _scrollStart < itemWidths.length &&
      scrollLeft > itemWidths[_scrollStart]
    ) {
      scrollLeft -= itemWidths[_scrollStart];
      _scrollStart++;
    }

    let _scrollEnd = _scrollStart;
    while (
      _scrollEnd < itemWidths.length &&
      scrollLeft + clientWidth > itemWidths[_scrollEnd]
    ) {
      scrollLeft -= itemWidths[_scrollEnd];
      _scrollEnd++;
    }

    _scrollStart = Math.max(0, _scrollStart - 1);
    _scrollEnd = Math.min(itemWidths.length - 1, _scrollEnd + 1);

    if (_scrollStart !== scrollStart) {
      scrollStart = _scrollStart;
    }
    if (_scrollEnd !== scrollEnd) {
      scrollEnd = _scrollEnd;
    }
  }
</script>

{#if videos}
  <div class="text-lg font-semibold m-4">
    {feed.title}
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
