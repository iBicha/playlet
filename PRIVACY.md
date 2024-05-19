# PRIVACY POLICY

## Playlet

Playlet, the Roku app, does not collect any user information whatsoever.
In fact, it does not have any servers capable of collecting any form of data.

Playlet does not show advertising, whether personalized or non personalized.

## Invidious

Playlet may request information from one or more [Invidious](https://invidious.io/)
servers, depending on user configuration. With these requests, absolutely no
user data is collected, and only the bare minimum and necessary information
is sent, which is used to enable the viewing of content.

Please note that some of the [Invidious](https://invidious.io/) servers used
could be public instances hosted by volenteers. These instances are available
[here](https://api.invidious.io/).

While invidious does no data collection by default, and it is in fact built to
be privacy driven, but in theory, from a Playlet request it is possible to
know the IP address of a user, the identifiers of watched video, and search
keywords. In case the user has privacy concerns, they can host their own
Invidious instance and use it from Playlet.

## SponsorBlock

Playlet may request information from a [SponsorBlock](https://github.com/ajayyy/SponsorBlock)
server, in order to get sponsor sections for requested videos to watch.
With these requests, absolutely no
user data is collected, and only the bare minimum and necessary information
is sent, which is used to enable the viewing of content.

Playlet uses hashing when requesting video metadata, which obfuscates
the video id requested. This is a SponsorBlock privacy feature that protects
user privacy.

Additionally, Playlet may send a "skipped" event to SponsorBlock, to indicate
that a section of a video has been skipped. This event does not have any
tracking information attached to it, and it is anonymous. It is merely to
indicate to contributors how much their contributions are being used in the wild.

## LeanBack

LeanBack, also known as Lounge API, also known as "cast from phone". Is a feature that Playlet implmements as a convenience to allow users to use a separate device to browse and cast videos.
When this feature is used, all traffic related to the videos being watched, added to the queue, and the video player state is routed through YouTube servers.

Playlet tries to preserve user privacy, to the best of its ability, by implementing several techniques, such as randomizing device id, using a fresh session on each start, and only providing necessary fields for the feature to function.
Additionally, Playlet does not join a session/lounge, until a device is attempting to connect using DIAL (**DI**scovery **A**nd **L**aunch spec) also know sa "Connect with Wi-Fi", or when a `Link with TV code` is generated, by visiting the appropriate settings page.

If you have privacy concerns and do not wish to use this functionality, simply do not connect from a local network using the YouTube app or the browser, and do not visit the `Link with TV code` tab.
