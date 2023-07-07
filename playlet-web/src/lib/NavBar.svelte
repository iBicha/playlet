<script lang="ts">
  import playletLogoDark from "../assets/logo-dark.svg";
  import playletLogoLight from "../assets/logo-light.svg";
  import UserIcon from "../assets/user.svg.svelte";
  import { PlayletApi } from "./PlayletApi";
  import { appThemeStore, playletStateStore } from "./Stores";
  import ThemeSelect from "./ThemeToggle.svelte";

  let version;
  let loggedIn = false;
  let auth_url;
  let currentInstance;
  let loggedInInstance;
  let username;

  playletStateStore.subscribe((value) => {
    version = value?.app?.lib_version ?? "";
    if (value?.app?.id === "dev") {
      version += "-dev";
    }
    if (
      value?.app?.lib_url_type === "custom" &&
      value?.app?.lib_url ===
        "https://github.com/iBicha/playlet/releases/download/unstable/playlet-lib.zip"
    ) {
      version += "-unstable";
    }
    loggedIn = value?.invidious?.logged_in;
    auth_url = value?.invidious?.auth_url;
    currentInstance = value?.invidious?.current_instance;
    loggedInInstance = value?.invidious?.logged_in_instance;
    username = value?.invidious?.logged_in_username;
  });

  const login = () => {
    if (!auth_url) {
      alert("Error with login, please refresh the page.");
      return;
    }
    window.location = auth_url;
  };
  const logout = async () => {
    await PlayletApi.logout();
    PlayletApi.getState().then((value) => {
      playletStateStore.set(value);
    });
  };
</script>

<div class="navbar bg-base-100 sticky top-0 z-40">
  <div class="flex-1">
    <img
      src={$appThemeStore === "dark" ? playletLogoDark : playletLogoLight}
      class="h-8"
      alt="Playlet Logo"
    />
    <h4 class="label brightness-75">{version}</h4>
  </div>
  <div class="flex-none">
    <ThemeSelect />
    {#if loggedIn && username}
      <div class="badge badge-outline">
        <span>{username}</span>
      </div>
    {/if}
    <div class="dropdown dropdown-end">
      <div tabindex="-1" class="btn btn-ghost btn-circle avatar">
        <div class="w-8 rounded-full">
          <UserIcon />
        </div>
      </div>
      <ul
        tabindex="-1"
        class="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box"
      >
        {#if loggedIn}
          <li>
            <div
              class="tooltip tooltip-left"
              data-tip={`Logout from ${loggedInInstance}`}
            >
              <button on:click={logout}>Logout</button>
            </div>
          </li>
        {:else}
          <li>
            <div
              class="tooltip tooltip-left"
              data-tip={`Login using ${currentInstance}`}
            >
              <button on:click={login}>Login</button>
            </div>
          </li>
        {/if}
      </ul>
    </div>
  </div>
</div>
