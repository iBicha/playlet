<script lang="ts">
  export let title: string | undefined = undefined;
  export let videoCount: number | undefined = undefined;
  export let playlistThumbnail: string | undefined = undefined;
  export let videos: any[] | undefined = undefined;

  export let invidiousInstance;

  let thumbnailUrl;

  $: {
    let url = "";
    if (playlistThumbnail) {
      url = playlistThumbnail;
      if (url.startsWith("/") && invidiousInstance) {
        url = invidiousInstance + url;
      }
    } else if (videos && videos.length) {
      const video = videos[0];
      if (video.videoThumbnails) {
        const videoThumbnail =
          video.videoThumbnails.find(
            (thumbnail) => thumbnail.quality === "medium"
          ) || video.videoThumbnails[0];
        url = videoThumbnail.url;
      }
      if (url.startsWith("/") && invidiousInstance) {
        url = invidiousInstance + url;
      }
    }
    if (url === "") {
      url = `${invidiousInstance}/vi/-----------/mqdefault.jpg`;
    }
    thumbnailUrl = url;
  }
</script>

<figure class="relative">
  <img
    class="w-full rounded-box aspect-video object-cover"
    loading="lazy"
    width="320"
    height="180"
    src={thumbnailUrl}
    alt={title}
  />
  <div
    class="absolute bottom-2 right-0 bg-black/70 text-white text-sm rounded-sm pt-1 pb-1 pr-2 pl-2"
  >
    {videoCount} videos
  </div>
</figure>
