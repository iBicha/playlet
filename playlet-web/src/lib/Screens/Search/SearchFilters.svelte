<script lang="ts">
  let modal;

  export let label = "Filters";

  export const filters = {
    date: "",
    type: "",
    duration: "",
    features: [],
    sort_by: "",
  };

  let features_kv: any = {};

  $: {
    filters.features = Object.keys(features_kv).filter(
      (key) => features_kv[key]
    );
  }

  $: {
    let count = 0;

    count += filters.date ? 1 : 0;
    count += filters.type ? 1 : 0;
    count += filters.duration ? 1 : 0;
    count += filters.features.length;
    count += filters.sort_by ? 1 : 0;

    label = `Filters` + `${count > 0 ? ` (${count})` : ""}`;
  }

  const options = {
    date: [
      {
        title: "Any date",
        value: "",
      },
      {
        title: "Last hour",
        value: "hour",
      },
      {
        title: "Today",
        value: "today",
      },
      {
        title: "This week",
        value: "week",
      },
      {
        title: "This month",
        value: "month",
      },
      {
        title: "This year",
        value: "year",
      },
    ],
    type: [
      {
        title: "Any type",
        value: "",
      },
      {
        title: "Video",
        value: "video",
      },
      {
        title: "Playlist",
        value: "playlist",
      },
      {
        title: "Channel",
        value: "channel",
      },
      {
        title: "Movie",
        value: "movie",
      },
      {
        title: "Show",
        value: "show",
      },
    ],
    duration: [
      {
        title: "Any duration",
        value: "",
      },
      {
        title: "Under 4 minutes",
        value: "short",
      },
      {
        title: "4 - 20 minutes",
        value: "medium",
      },
      {
        title: "Over 20 minutes",
        value: "long",
      },
    ],
    features: [
      {
        title: "Live",
        value: "live",
      },
      {
        title: "4K",
        value: "4k",
      },
      {
        title: "HD",
        value: "hd",
      },
      {
        title: "Subtitles/CC",
        value: "subtitles",
      },
      {
        title: "Creative Commons",
        value: "creative_commons",
      },
      {
        title: "360°",
        value: "360",
      },
      {
        title: "VR180",
        value: "vr180",
      },
      {
        title: "3D",
        value: "3d",
      },
      {
        title: "HDR",
        value: "hdr",
      },
      {
        title: "Purchased",
        value: "purchased",
      },
      {
        title: "Location",
        value: "location",
      },
    ],
    sort_by: [
      {
        title: "Relevance",
        value: "",
      },
      {
        title: "Upload date",
        value: "upload_date",
      },
      {
        title: "View count",
        value: "view_count",
      },
      {
        title: "Rating",
        value: "rating",
      },
    ],
  };

  export function open() {
    modal.showModal();
  }
</script>

<dialog bind:this={modal} id="modal_search_filters" class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">{label}</h2>

      <div class="mb-4">
        <h3 class="text-lg font-bold mb-2">Date</h3>
        <select class="input input-bordered w-full" bind:value={filters.date}>
          {#each options.date as { title, value }}
            <option {value}>{title}</option>
          {/each}
        </select>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-bold mb-2">Type</h3>
        <select class="input input-bordered w-full" bind:value={filters.type}>
          {#each options.type as { title, value }}
            <option {value}>{title}</option>
          {/each}
        </select>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-bold mb-2">Duration</h3>
        <select
          class="input input-bordered w-full"
          bind:value={filters.duration}
        >
          {#each options.duration as { title, value }}
            <option {value}>{title}</option>
          {/each}
        </select>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-bold mb-2">Features</h3>
        {#each options.features as { title, value }}
          <label class="flex items-center">
            <input
              type="checkbox"
              {value}
              class="form-checkbox"
              bind:checked={features_kv[value]}
            />
            <span class="ml-2">{title}</span>
          </label>
        {/each}
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-bold mb-2">Sort By</h3>
        <select
          class="input input-bordered w-full"
          bind:value={filters.sort_by}
        >
          {#each options.sort_by as { title, value }}
            <option {value}>{title}</option>
          {/each}
        </select>
      </div>

      <div class="flex justify-end">
        <button
          class="btn btn-outline"
          type="button"
          on:click={() => modal.close()}>Close</button
        >
      </div>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>Close</button>
  </form>
</dialog>
