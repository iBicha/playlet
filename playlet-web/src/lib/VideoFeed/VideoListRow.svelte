<script lang="ts">
  import { InvidiousApi } from "lib/Api/InvidiousApi";
  import {
    invidiousVideoApiStore,
    localVideoApiStore,
    playletStateStore,
  } from "lib/Stores";
  import VideoCell from "./VideoCell.svelte";
  import PlaylistCell from "./PlaylistCell.svelte";
  import ChannelCell from "./ChannelCell.svelte";

  // TODO:P1 figure out why some uncached feeds (e.g. channels/ucid/videos) get hit twice
  export let feed: any = undefined;
  let videos = [];

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
  let carouselElementIntersecting = false;

  let scrollStart = 0;
  let scrollEnd = 0;

  let loadDataTask = undefined;

  // w-80|w-60 p-2: 320px|240px + 16px padding on each side
  const videoItemWidth = 320 + 16 * 2;
  const channelItemWidth = 240 + 16 * 2;

  const intersectionObserver = new IntersectionObserver(
    function (entries) {
      carouselElementIntersecting = entries[0].isIntersecting;
      if (carouselElementIntersecting) {
        loadRow();
      }
    },
    { threshold: [0] }
  );

  $: {
    if (feed) {
      feedSourcesIndex = 0;
      feedLoadState = FeedLoadState.None;
      videos = [];
      itemWidths = [];
      scrollStart = 0;
      scrollEnd = 0;
      loadDataTask = undefined;
    }
  }

  $: {
    if (
      carouselElement &&
      carouselElementIntersecting &&
      itemWidths &&
      itemWidths.length
    ) {
      recalculateVisibileCells();
    }
  }

  $: {
    if (videos && scrollEnd >= videos.length - 1) {
      loadRow();
    }
  }

  $: {
    if (carouselElement) {
      intersectionObserver.observe(carouselElement);
    }
  }

  let invidiousApi = new InvidiousApi();

  playletStateStore.subscribe((value) => {
    invidiousApi.instance = value?.invidious?.current_instance;
    invidiousApi.userCountryCode = value?.device?.user_country_code ?? "US";
    invidiousApi.isLoggedIn = value.invidious?.logged_in ?? false;
    loadRow();
  });

  let invidiousVideoApiLoaded = false;
  let localVideoApiLoaded = false;

  invidiousVideoApiStore.subscribe((value) => {
    for (const key in value) {
      value[key].apiType = "Invidious";
    }

    invidiousApi.endpoints = invidiousApi.endpoints || {};
    invidiousApi.endpoints = { ...invidiousApi.endpoints, ...value };
    invidiousVideoApiLoaded = Object.keys(value).length > 0;

    if (invidiousVideoApiLoaded && localVideoApiLoaded) {
      loadRow();
    }
  });

  localVideoApiStore.subscribe((value) => {
    for (const key in value) {
      value[key].apiType = "Local";
    }

    invidiousApi.endpoints = invidiousApi.endpoints || {};
    invidiousApi.endpoints = { ...invidiousApi.endpoints, ...value };
    localVideoApiLoaded = Object.keys(value).length > 0;

    if (invidiousVideoApiLoaded && localVideoApiLoaded) {
      loadRow();
    }
  });

  async function loadRow() {
    if (!invidiousApi.canMakeRequest()) {
      return;
    }

    if (!carouselElementIntersecting) {
      return;
    }

    if (scrollEnd < videos.length - 3) {
      return;
    }

    if (
      feedLoadState === FeedLoadState.Loading ||
      feedLoadState === FeedLoadState.Loaded
    ) {
      return;
    }

    if (loadDataTask) {
      return;
    }

    try {
      loadDataTask = loadData();
      await loadDataTask;
    } catch (error) {
      console.error(error);
    }
    loadDataTask = undefined;
  }

  async function loadData() {
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
          feedSource.state.loadState = FeedLoadState.Error;
          feedSourcesIndex++;
          if (feedSourcesIndex >= feedSources.length) {
            feedLoadState = FeedLoadState.Loaded;
          }
          continue;
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
          feedSourcesIndex >= feedSources.length - 1
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
          // Set this to a number that's usually larger than what can fit on the screen.
          if (totalFetchedItems > 6) {
            break;
          }
        }
      } catch (error) {
        // TODO:P0 handle case of unauthenticated calls
        // TODO:P0 handle case of popular feed disabled
        // If we're done loading all the feed, but still have no videos, hide the whole component.
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

<!-- Hide rows that are loaded but have no videos. Typically a 
     disabled feed (like popular) or unauthenticated. 
     TODO:P1 show action nodes (action to login)
-->
{#if feedLoadState !== FeedLoadState.Loaded || videos.length !== 0}
  <div class="text-lg font-semibold ml-4">
    {feed.title}
  </div>
  <div
    class="carousel carousel-center rounded-box w-full space-x-4"
    style="min-height: 16rem;"
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
