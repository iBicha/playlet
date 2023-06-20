<script lang="ts">
  import { onMount } from "svelte";
  import { PlayletApi } from "./PlayletApi";
  import ScreenHomeRow from "./ScreenHomeRow.svelte";
  import { invidiousVideoApiStore } from "./Stores";

  let homeLayoutFile = [];
  onMount(async () => {
    const getHomeLayoutFile = PlayletApi.getHomeLayoutFile();
    const getInvidiousVideoApiFile = PlayletApi.getInvidiousVideoApiFile();
    homeLayoutFile = await getHomeLayoutFile;
    const invidiousVideoApiFile = await getInvidiousVideoApiFile;
    const invidiousVideoApiDefinitions = invidiousVideoApiFile.endpoints.reduce(
      (acc, endpoint) => {
        acc[endpoint.name] = endpoint;
        return acc;
      },
      {}
    );
    invidiousVideoApiStore.set(invidiousVideoApiDefinitions);
  });
</script>

{#each homeLayoutFile as homeLayoutItem}
    <ScreenHomeRow requestData={homeLayoutItem} />
{/each}
