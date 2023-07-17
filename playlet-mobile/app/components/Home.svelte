<script lang="ts">
  /*
  A couple of notes:
  - URLSearchParams is not defined
  - must configure app for unsecure http
  */

  export let sharedText: string | undefined = "";

  let videoId: string | undefined;
  let timestamp: string = "0";

  const host = "http://192.168.1.107:8888";

  $: {
    if (sharedText) {
      const parsedUrl = parseYouTubeUrl(sharedText);
      if (parsedUrl) {
        if (parsedUrl.videoId) {
          videoId = parsedUrl.videoId;
        }
        if (parsedUrl.timestamp) {
          timestamp = parsedUrl.timestamp;
        }
      }
    }
  }

  function parseYouTubeUrl(url: string) {
    function getTimestamp() {
      return undefined;
    }

    // Share/Short url
    const YoutubeUrls = [
      "https://youtu.be/",
      "http://youtu.be/",
      "https://www.youtu.be/",
      "http://www.youtu.be/",
      "https://youtube.com/shorts/",
      "http://youtube.com/shorts/",
      "https://www.youtube.com/shorts/",
      "http://www.youtube.com/shorts/",
    ];
    for (var i in YoutubeUrls) {
      let youtubeUrl = YoutubeUrls[i];
      if (url.startsWith(youtubeUrl)) {
        let videoId = url.replace(youtubeUrl, "");
        if (videoId.includes("?")) {
          videoId = videoId.substring(0, videoId.indexOf("?"));
        }
        const result: any = {
          videoId,
        };

        const timestamp = getTimestamp();
        if (timestamp) {
          result.timestamp = timestamp;
        }
        return result;
      }
    }
  }

  async function playVideo(
    videoId: string | undefined,
    timestamp: string | undefined
  ) {
    if (!videoId) {
      return;
    }
    const payload: any = { command: "play", videoId: videoId };
    if (timestamp !== undefined) {
      payload["timestamp"] = timestamp;
    }

    try {
      const response = await postJson(`${host}/api/command`, payload);
    } catch (error) {
      console.error(error);
    }
  }

  async function postJson(url: string, payload: any) {
    return fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
</script>

<page>
  <actionBar title="Home" />
  <stackLayout>
    <label class="info">
      <formattedString>
        <span text="Url: {sharedText}" />
      </formattedString>
    </label>
    <label class="info">
      <formattedString>
        <span text="Video: {videoId}" />
      </formattedString>
    </label>
    <label class="info">
      <formattedString>
        <span text="Time: {timestamp}" />
      </formattedString>
    </label>
    {#if videoId}
      <button
        text="Cast {videoId} at {timestamp}"
        on:tap={() => playVideo(videoId, timestamp)}
      />
    {/if}
  </stackLayout>
</page>

<style>
  .info .fas {
    color: #3a53ff;
  }

  .info {
    font-size: 20;
    horizontal-align: center;
    vertical-align: center;
  }
</style>
