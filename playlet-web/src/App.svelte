<script lang="ts">
  import { onMount } from "svelte";
  import InstanceInfo from "./lib/InstanceInfo.svelte";
  import NavBar from "./lib/NavBar.svelte";
  import PlayVideo from "./lib/PlayVideo.svelte";
  import ClearSearchHistory from "./lib/ClearSearchHistory.svelte";
  import { PlayletApi } from "./lib/PlayletApi";
  import { appStateStore, playletStateStore } from "./lib/Stores";
  import LegacyUI from "./lib/LegacyUI.svelte";
  import BottomNavigation from "./lib/BottomNavigation.svelte";
  import ScreenHome from "./lib/ScreenHome.svelte";
  import type { AppState } from "./lib/Types";
  import ScreenSearch from "./lib/ScreenSearch.svelte";
  import ScreenSettings from "./lib/ScreenSettings.svelte";
  import ScreenInfo from "./lib/ScreenInfo.svelte";

  onMount(async () => {
    const playletState = await PlayletApi.getState();
    playletStateStore.set(playletState);
  });

  let currentScreen: AppState["screen"];
  appStateStore.subscribe((value) => {
    currentScreen = value.screen;
  });

</script>

<main>
  <NavBar />
  {#if currentScreen == "search"}
    <ScreenSearch />
  {/if}
  {#if currentScreen == "home"}
    <ScreenHome />
  {/if}
  {#if currentScreen == "settings"}
    <ScreenSettings />
  {/if}
  {#if currentScreen == "info"}
    <ScreenInfo />
  {/if}
  <BottomNavigation />
</main>
