# snapin

## Set up enviroment 
- Create .env file, and fill out the following
```
ENV=
SNAPIN_WEBPORT=
SNAPIN_SESSION_SECRET=
STRIPE_API_KEY=
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