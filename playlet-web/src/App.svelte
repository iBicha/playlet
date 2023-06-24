<script lang="ts">
  import { onMount } from "svelte";
  import NavBar from "./lib/NavBar.svelte";
  import { PlayletApi } from "./lib/PlayletApi";
  import { appStateStore, homeLayoutFileStore, invidiousVideoApiStore, playletStateStore, preferencesModelStore, searchHistoryStore, userPreferencesStore } from "./lib/Stores";
  import BottomNavigation from "./lib/BottomNavigation.svelte";
  import ScreenHome from "./lib/ScreenHome.svelte";
  import type { AppState } from "./lib/Types";
  import ScreenSearch from "./lib/ScreenSearch.svelte";
  import ScreenSettings from "./lib/ScreenSettings.svelte";
  import ScreenInfo from "./lib/ScreenInfo.svelte";
  import LinkDragDrop from "./lib/LinkDragDrop.svelte";

  onMount(async () => {
    PlayletApi.getState().then((value) => {
      playletStateStore.set(value);
    });

    PlayletApi.getHomeLayoutFile().then((value) => {
      homeLayoutFileStore.set(value);
    });

    PlayletApi.getInvidiousVideoApiFile().then((invidiousVideoApiFile) => {
      const invidiousVideoApiDefinitions =
        invidiousVideoApiFile.endpoints.reduce((acc, endpoint) => {
          acc[endpoint.name] = endpoint;
          return acc;
        }, {});
      invidiousVideoApiStore.set(invidiousVideoApiDefinitions);
    });

    PlayletApi.getPreferencesFile().then((value) => {
      preferencesModelStore.set(value);
    });

    PlayletApi.getUserPreferences().then((value) => {
      userPreferencesStore.set(value);
    });

    PlayletApi.getSearchHistory().then((value) => {
      searchHistoryStore.set(value);
    });
  });

  let currentScreen: AppState["screen"];
  appStateStore.subscribe((value) => {
    currentScreen = value.screen;
  });
</script>

<main>
  <LinkDragDrop />

  <NavBar />
  <!-- TODO: a better way to make the BottomNavigation not hide screens -->
  <div style="margin-bottom: 4rem">
    <ScreenSearch visibility={currentScreen == "search"} />

    <ScreenHome visibility={currentScreen == "home"} />

    <ScreenSettings visibility={currentScreen == "settings"} />

    <ScreenInfo visibility={currentScreen == "info"} />
  </div>
  <BottomNavigation />
</main>
