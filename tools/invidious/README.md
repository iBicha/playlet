# Invidious

Just an Invidious docker-compose setup for quick testing with Playlet.
Detailed instructions in <https://docs.invidious.io/installation/#docker-compose-method-production>

To run:

- Create a `.env` file next to `docker-compose.yml`
- Generate two random passwords of 16 characters (e.g. using command `pwgen 16 1`)
- Add the two variables to your `.env` file

```sh
INVIDIOUS_HMAC_KEY=PASSWORD_1
INVIDIOUS_COMPANION_KEY=PASSWORD_2
```

- Run `docker-compose up`

Invidious should now be running locally on port 3000.
