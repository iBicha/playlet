<script lang="ts">
  import HomeIcon from "../assets/home-icon.svg.svelte";
  import InfoIcon from "../assets/info-icon.svg.svelte";
  import SearchIcon from "../assets/search-icon.svg.svelte";
  import SettingsIcon from "../assets/settings-icon.svg.svelte";
  import { appStateStore } from "./Stores";
  import type { AppState } from "./Types";

  let currentScreen: AppState["screen"];
  appStateStore.subscribe((value) => {
    currentScreen = value.screen;
  });

  function setScreen(screen: AppState["screen"]) {
    appStateStore.update((state) => {
      state.screen = screen;
      return state;
    });
  }
</script>

<div class="btm-nav">
  <button
    on:click={() => setScreen("search")}
    class={currentScreen === "search" ? "active" : ""}
  >
    <div class="h-6">
      <SearchIcon />
    </div>
  </button>
  <button
    on:click={() => setScreen("home")}
    class={currentScreen === "home" ? "active" : ""}
  >
    <div class="h-6">
      <HomeIcon />
    </div>
  </button>
  <button
    on:click={() => setScreen("settings")}
    class={currentScreen === "settings" ? "active" : ""}
  >
    <div class="h-6">
      <SettingsIcon />
    </div>
  </button>
  <button
    on:click={() => setScreen("info")}
    class={currentScreen === "info" ? "active" : ""}
  >
    <div class="h-6">
      <InfoIcon />
    </div>
  </button>
</div>
