<script lang="ts">
    import { PlayletApi } from "./PlayletApi";

    let videoId;

    function IsValidHttpUrl(string) {
        let url;
        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
    }

    function GetVideoId(url) {
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
                url = url.replace(youtubeUrl, "");
                if (url.includes("?")) {
                    url = url.substring(0, url.indexOf("?"));
                }
                return url;
            }
        }

        // regular url
        url = new URL(url);
        const urlSearchParams = new URLSearchParams(url.search);
        return urlSearchParams.get("v");
    }

    const playVideo = async () => {
        let v = videoId;
        if (IsValidHttpUrl(v)) {
            v = GetVideoId(v);
        }
        if (!v || v.length < 8) {
            alert("Please set video id");
            return;
        }

        await PlayletApi.playVideo(v);
    };
</script>

<div class="form-control">
    <div class="input-group">
        <input
            type="text"
            placeholder="Video ID"
            class="input input-bordered"
            bind:value={videoId}
        />
        <button class="btn" on:click={playVideo}> Play </button>
    </div>
</div>
