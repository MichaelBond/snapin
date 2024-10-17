# snapin

## Set up enviroment for docker
- Create .env file, and fill out the following
```
ENV=docker
SNAPIN_WEBPORT=4000
SNAPIN_SESSION_SECRET=<Random String>
STRIPE_API_KEY=<Stripe Test api key>
```

## Run Docker Services 
Make sure docker is installed 
```docker compose up```

## .env for other environments
```
ENV=
SNAPIN_SESSION_SECRET=
SNAPIN_WEBPORT=
STRIPE_API_KEY=
MYSQL_HOST=
MYSQL_PORT=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
QUANTREX_SERVER=
QUANTREX_DATABASE=
QUANTREX_USER=
QUANTREX_PASSWORD=
QUANTREX_PORT=
QUANTREX_REQUEST_TIMEOUT=
QUANTREX_POOL_MAX=
QUANTREX_POOL_MIN=
QUANTREX_IDLE_TIMEOUT=
```

## Run App Locally 
1. Turn on Typescript watch in on terminal 

    ```npm run watch``` 

2. Run dev server in another terminal 

    ```npm run dev```

## Initializing typescript server 
Remove this section when not needed 
- npm install typescript ts-node @types/node @types/express
- npx tsc --init