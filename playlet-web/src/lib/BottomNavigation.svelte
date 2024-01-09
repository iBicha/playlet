<script lang="ts">
  import HomeIcon from "../assets/home-icon.svg.svelte";
  import InfoIcon from "../assets/info-icon.svg.svelte";
  import SearchIcon from "../assets/search-icon.svg.svelte";
  import SettingsIcon from "../assets/settings-icon.svg.svelte";
  import BookmarksIcon from "../assets/star-icon.svg.svelte";
  import RemoteIcon from "../assets/remote-control.svg.svelte";

  import { appStateStore } from "lib/Stores";
  import { ScreenNames, type AppState } from "lib/Types";
  import { onMount } from "svelte";

  function setScreen(screen: AppState["screen"]) {
    appStateStore.update((state) => {
      if (state.screen === screen) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
      state.screen = screen;
      return state;
    });
    setScreenNameInUrl(screen);
  }

  onMount(() => {
    const screen = getScreenNameInUrl();
    if (screen) {
      setScreen(screen);
    } else {
      setScreenNameInUrl("home");
    }
  });

  function getScreenNameInUrl(): AppState["screen"] | undefined {
    const hash = window.location.hash;
    if (hash) {
      const screen = hash.substring(1) as AppState["screen"];
      if (!ScreenNames.includes(screen)) {
        return;
      }
      return screen;
    }
  }

  function setScreenNameInUrl(screen: AppState["screen"]) {
    window.location.hash = screen;
  }
</script>

<div class="btm-nav">
  <button
    on:click={() => setScreen("search")}
    class={$appStateStore.screen === "search" ? "active" : ""}
  >
    <div class="h-6">
      <SearchIcon />
    </div>
    <span class="text-xs">Search</span>
  </button>
  <button
    on:click={() => setScreen("home")}
    class={$appStateStore.screen === "home" ? "active" : ""}
  >
    <div class="h-6">
      <HomeIcon />
    </div>
    <span class="text-xs">Home</span>
  </button>
  <button
    on:click={() => setScreen("bookmarks")}
    class={$appStateStore.screen === "bookmarks" ? "active" : ""}
  >
    <div class="h-6">
      <BookmarksIcon />
    </div>
    <span class="text-xs">Bookmarks</span>
  </button>
  <button
    on:click={() => setScreen("settings")}
    class={$appStateStore.screen === "settings" ? "active" : ""}
  >
    <div class="h-6">
      <SettingsIcon />
    </div>
    <span class="text-xs">Settings</span>
  </button>
  <button
    on:click={() => setScreen("remote")}
    class={$appStateStore.screen === "remote" ? "active" : ""}
  >
    <div class="h-6">
      <RemoteIcon />
    </div>
    <span class="text-xs">Remote</span>
  </button>
  <button
    on:click={() => setScreen("info")}
    class={$appStateStore.screen === "info" ? "active" : ""}
  >
    <div class="h-6">
      <InfoIcon />
    </div>
    <span class="text-xs">Info</span>
  </button>
</div>
