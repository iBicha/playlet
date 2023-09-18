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
be privacy driven, but in theory, from a playlet request it is possible to 
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
indicate to  contributers how much their contributions are being used in the wild.
