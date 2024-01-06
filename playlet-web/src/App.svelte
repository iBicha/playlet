<script lang="ts">
  import { onMount } from "svelte";
  import NavBar from "lib/NavBar.svelte";
  import { PlayletApi } from "lib/Api/PlayletApi";
  import {
    appStateStore,
    bookmarksStore,
    homeLayoutFileStore,
    homeLayoutStore,
    invidiousVideoApiStore,
    localVideoApiStore,
    playletStateStore,
    preferencesModelStore,
    searchHistoryStore,
    userPreferencesStore,
  } from "lib/Stores";
  import BottomNavigation from "lib/BottomNavigation.svelte";
  import HomeScreen from "lib/Screens/HomeScreen.svelte";
  import type { AppState } from "lib/Types";
  import SearchScreen from "lib/Screens/SearchScreen.svelte";
  import SettingsScreen from "lib/Screens/SettingsScreen.svelte";
  import InfoScreen from "lib/Screens/InfoScreen.svelte";
  import LinkDragDrop from "lib/LinkDragDrop.svelte";
  import BookmarksScreen from "lib/Screens/BookmarksScreen.svelte";
  import RemoteControlScreen from "lib/Screens/RemoteControlScreen.svelte";

  onMount(async () => {
    PlayletApi.getState().then((value) => {
      playletStateStore.set(value);
    });

    PlayletApi.getHomeLayout().then((value) => {
      homeLayoutStore.set(value);
    });

    PlayletApi.getHomeLayoutFile().then((value) => {
      homeLayoutFileStore.set(value);
    });

    PlayletApi.getInvidiousVideoApiFile().then((apiDefinitions) => {
      invidiousVideoApiStore.set(apiDefinitions);
    });

    PlayletApi.getLocalVideoApiFile().then((apiDefinitions) => {
      localVideoApiStore.set(apiDefinitions);
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

    PlayletApi.getBookmarkFeeds().then((value) => {
      bookmarksStore.set(value);
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
  <!-- TODO:P2 a better way to make the BottomNavigation not hide screens -->
  <div style="margin-bottom: 4rem">
    <SearchScreen visibility={currentScreen == "search"} />

    <HomeScreen visibility={currentScreen == "home"} />

    <BookmarksScreen visibility={currentScreen == "bookmarks"} />

    <SettingsScreen visibility={currentScreen == "settings"} />

    <RemoteControlScreen visibility={currentScreen == "remote"} />

    <InfoScreen visibility={currentScreen == "info"} />
  </div>
  <BottomNavigation />
</main>
