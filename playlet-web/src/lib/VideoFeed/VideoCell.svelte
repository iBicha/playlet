<script lang="ts">
  import { playletStateStore, tr } from "lib/Stores";
  import VideoCastDialog from "./VideoCastDialog.svelte";
  import VideoThumbnail from "./VideoThumbnail.svelte";
  import ChannelCastDialog from "./ChannelCastDialog.svelte";
  import { get } from "svelte/store";
  import { getFormattedPluralString } from "lib/Api/Locale";

  export let title: string | undefined = undefined;
  export let videoId: string | undefined = undefined;
  export let author: string | undefined = undefined;
  export let videoThumbnails: any[] | undefined = undefined;
  export let viewCount: number | undefined = undefined;
  export let published: number = undefined;
  export let publishedText: string | undefined = undefined;
  export let isUpcoming: boolean = undefined;
  export let premiereTimestamp: number | undefined = undefined;
  export let lengthSeconds: number = undefined;
  export let lengthText: string | undefined = undefined;
  export let liveNow: boolean = undefined;

  // svelte-ignore unused-export-let
  export let type: string = undefined;
  // svelte-ignore unused-export-let
  export let authorId: string = undefined;
  // svelte-ignore unused-export-let
  export let authorUrl: string = undefined;
  // svelte-ignore unused-export-let
  export let authorVerified: boolean = undefined;
  // svelte-ignore unused-export-let
  export let description: string = undefined;
  // svelte-ignore unused-export-let
  export let descriptionHtml: string = undefined;
  // svelte-ignore unused-export-let
  export let viewCountText: string = undefined;
  // svelte-ignore unused-export-let
  export let premium: boolean = undefined;
  // svelte-ignore unused-export-let
  export let index: number = undefined;
  // svelte-ignore unused-export-let
  export let indexId: string = undefined;

  let videoModal;
  let channelModal;
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    invidiousInstance = value?.invidious?.current_instance;
  });

  function getViewCountDateText() {
    if (isUpcoming && premiereTimestamp) {
      return getPremieresInText();
    }
    const pubText = getPublishedText();
    const viewCountText = formatViewCount(viewCount);

    if (pubText === "" && viewCountText === "") {
      return "";
    }

    return `${pubText} • ${viewCountText}`;
  }

  function formatViewCount(viewCount) {
    if (isNaN(viewCount)) {
      return "";
    }
    return getFormattedPluralString(viewCount, "0 views", "1 view", "^n views");
  }

  function getPremieresInText() {
    if (!isUpcoming || isNaN(premiereTimestamp)) {
      return "";
    }

    const trFn = get(tr);

    const currentTime = Math.floor(Date.now() / 1000);
    let timeLeft = premiereTimestamp - currentTime;
    if (timeLeft <= 0) {
      return trFn("Premiering now");
    }

    if (timeLeft < 60) {
      if (timeLeft === 1) {
        return trFn("Premieres in 1 second");
      } else {
        return trFn("Premieres in ^n seconds").replace(
          "^n",
          timeLeft.toString()
        );
      }
    }

    if (timeLeft < 3600) {
      const minutes = Math.floor(timeLeft / 60);
      if (minutes === 1) {
        return trFn("Premieres in 1 minute");
      } else {
        return trFn("Premieres in ^n minutes").replace(
          "^n",
          minutes.toString()
        );
      }
    }

    if (timeLeft < 86400) {
      const hours = Math.floor(timeLeft / 3600);
      if (hours === 1) {
        return trFn("Premieres in 1 hour");
      } else {
        return trFn("Premieres in ^n hours").replace("^n", hours.toString());
      }
    }

    const days = Math.floor(timeLeft / 86400);
    if (days === 1) {
      return trFn("Premieres in 1 day");
    } else {
      return trFn("Premieres in ^n days").replace("^n", days.toString());
    }
  }

  function getPublishedText() {
    if (isNaN(published)) {
      return "";
    }
    const trFn = get(tr);
    const currentTime = Math.floor(Date.now() / 1000);
    const span = currentTime - published;
    if (span < 1) {
      return publishedText || "";
    }

    const totalDays = Math.floor(span / 86400);
    if (totalDays > 365) {
      const years = Math.floor(totalDays / 365);
      if (years === 1) {
        return trFn("1 year ago");
      } else {
        return trFn("^n years ago").replace("^n", years.toString());
      }
    } else if (totalDays > 30) {
      const months = Math.floor(totalDays / 30);
      if (months === 1) {
        return trFn("1 month ago");
      } else {
        return trFn("^n months ago").replace("^n", months.toString());
      }
    } else if (totalDays > 7) {
      const weeks = Math.floor(totalDays / 7);
      if (weeks === 1) {
        return trFn("1 week ago");
      } else {
        return trFn("^n weeks ago").replace("^n", weeks.toString());
      }
    } else if (totalDays > 0) {
      if (totalDays === 1) {
        return trFn("1 day ago");
      } else {
        return trFn("^n days ago").replace("^n", totalDays.toString());
      }
    } else if (span > 3600) {
      const hours = Math.floor(span / 3600);
      if (hours === 1) {
        return trFn("1 hour ago");
      } else {
        return trFn("^n hours ago").replace("^n", hours.toString());
      }
    } else if (span > 60) {
      const minutes = Math.floor(span / 60);
      if (minutes === 1) {
        return trFn("1 minute ago");
      } else {
        return trFn("^n minutes ago").replace("^n", minutes.toString());
      }
    } else {
      return trFn("1 minute ago");
    }
  }
</script>

<button class="w-80 p-2" on:click={videoModal.show()}>
  <div class="card card-compact bg-base-100 shadow-xl border border-neutral">
    <VideoThumbnail
      bind:videoId
      bind:title
      bind:videoThumbnails
      bind:liveNow
      bind:isUpcoming
      bind:premiereTimestamp
      bind:lengthSeconds
      bind:lengthText
      bind:viewCount
      bind:invidiousInstance
    />
    <div class="card-body">
      <h3 class="card-title text-base line-clamp-2 min-h-12">{title || ""}</h3>
      <button
        class="font-semibold link"
        on:click={(e) => {
          e.stopPropagation();
          channelModal.show();
        }}
      >
        {author || ""}
      </button>
      <div>{getViewCountDateText()}</div>
    </div>
  </div>
</button>
<VideoCastDialog
  bind:this={videoModal}
  bind:videoId
  bind:title
  bind:author
  bind:lengthSeconds
  bind:lengthText
  bind:videoThumbnails
  bind:liveNow
  bind:isUpcoming
  bind:premiereTimestamp
  bind:viewCount
  videoStartAtChecked={false}
  videoStartAtTimestamp={0}
/>
<ChannelCastDialog bind:this={channelModal} bind:author bind:authorId />
