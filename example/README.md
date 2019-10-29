# How to run this example

### Server

You need to have PostgresQL install on you environment. After that, create `.env` file and fill it with the following values:

```
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=
PGDATABASE=points
PGPORT=5432
```

Make sure you have the correct host, username, password and database name.

Next, run the setup file:

```
ts-node setup.ts
```

This will install some random points.

Next, run the server:

```
ts-node express.ts
```

### Mapbox

Open `mapbox.html` and replace `mapboxgl.accessToken` with your mapbox access token. Now open this file into the browser.
