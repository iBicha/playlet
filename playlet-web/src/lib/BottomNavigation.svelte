<script lang="ts">
  import { appStateStore } from "./Stores";

  import searchIcon from "../assets/search.svg";
  import homeIcon from "../assets/home.svg";
  import settingsIcon from "../assets/settings.svg";
  import infoIcon from "../assets/info.svg";
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
    <img src={searchIcon} class="h-6" alt="Search" />
  </button>
  <button
    on:click={() => setScreen("home")}
    class={currentScreen === "home" ? "active" : ""}
  >
    <img src={homeIcon} class="h-6" alt="Home" />
  </button>
  <button
    on:click={() => setScreen("settings")}
    class={currentScreen === "settings" ? "active" : ""}
  >
    <img src={settingsIcon} class="h-6" alt="Settings" />
  </button>
  <button
    on:click={() => setScreen("info")}
    class={currentScreen === "info" ? "active" : ""}
  >
    <img src={infoIcon} class="h-6" alt="Info" />
  </button>
</div>
