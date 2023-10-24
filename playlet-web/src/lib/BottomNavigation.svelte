<script lang="ts">
  import HomeIcon from "../assets/home-icon.svg.svelte";
  import InfoIcon from "../assets/info-icon.svg.svelte";
  import SearchIcon from "../assets/search-icon.svg.svelte";
  import SettingsIcon from "../assets/settings-icon.svg.svelte";
  import BookmarksIcon from "../assets/star-icon.svg.svelte";

  import { appStateStore } from "lib/Stores";
  import type { AppState } from "lib/Types";

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
  </button>
  <button
    on:click={() => setScreen("home")}
    class={$appStateStore.screen === "home" ? "active" : ""}
  >
    <div class="h-6">
      <HomeIcon />
    </div>
  </button>
  <button
    on:click={() => setScreen("bookmarks")}
    class={$appStateStore.screen === "bookmarks" ? "active" : ""}
  >
    <div class="h-6">
      <BookmarksIcon />
    </div>
  </button>
  <button
    on:click={() => setScreen("settings")}
    class={$appStateStore.screen === "settings" ? "active" : ""}
  >
    <div class="h-6">
      <SettingsIcon />
    </div>
  </button>
  <button
    on:click={() => setScreen("info")}
    class={$appStateStore.screen === "info" ? "active" : ""}
  >
    <div class="h-6">
      <InfoIcon />
    </div>
  </button>
</div>
