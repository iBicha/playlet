<script lang="ts">
    import playletLogo from "../assets/logo-dark.svg";
    import { PlayletApi } from "./PlayletApi";
    import { playletStateStore } from "./Stores";

    let version;
    let loggedIn = false;
    let auth_url;
    let selectedInstance;
    let loggedInInstance;
    
    playletStateStore.subscribe((value) => {
        version = value?.app?.version ?? "";
        loggedIn = value?.invidious?.logged_in;
        auth_url = value?.invidious?.auth_url;
        selectedInstance = value?.invidious?.selected_instance;
        loggedInInstance = value?.invidious?.logged_in_instance;
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
        // TODO: reload state
        window.location.reload();
    };
</script>

<div class="navbar bg-base-100">
    <div class="flex-1">
        <img src={playletLogo} class="h-12" alt="Playlet Logo" />
        <h4 class="label brightness-75">{version}</h4>
    </div>
    <div class="flex-none">
        {#if loggedIn}
            <div class="tooltip tooltip-left" data-tip={loggedInInstance}>
                <button class="btn" on:click={logout}>Logout</button>
            </div>
        {:else}
            <div class="tooltip tooltip-left" data-tip={selectedInstance}>
                <button class="btn" on:click={login}>Login</button>
            </div>
        {/if}
    </div>
</div>
