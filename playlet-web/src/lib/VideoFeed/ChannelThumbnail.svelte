<script lang="ts">
  export let author: string | undefined = undefined;
  export let authorThumbnails: any[] | undefined = undefined;

  let thumbnailUrl;

  $: {
    if (authorThumbnails && authorThumbnails.length > 0) {
      const authorThumbnail = authorThumbnails[authorThumbnails.length - 1];
      let url = authorThumbnail.url;
      if (url.startsWith("//")) {
        url = "https:" + url;
      }
      thumbnailUrl = url;
    }
  }
</script>

<figure class="relative">
  <img
    class="w-44 rounded-full aspect-square object-cover"
    loading="lazy"
    width="176"
    height="176"
    src={thumbnailUrl}
    alt={author}
  />
</figure>
