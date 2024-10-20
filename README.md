# snapin

## Set up enviroment for docker
- Create .env file, and fill out the following
```
# SNAP IN
ENV=docker
SNAPIN_SESSION_SECRET=<Random String>

# STRIPE
STRIPE_API_KEY=<Stripe API key>

# PINECONE
PINECONE_ENVIRONMENT=
PINECONE_API_KEY=
PINECONE_INDEX=
PINECONE_PATH=

# CHAT GPT
CHATGPT_ORGANIZATION_ID=
CHATGPT_PROJECT_ID=
CHATGPT_SECRET_TOKEN=
```

## Run Docker Services 
Make sure docker is installed 
```docker compose up```

## .env for other environments
```
# Snap IN
ENV=
SNAPIN_SESSION_SECRET=
SNAPIN_WEBPORT=

# Stripe
STRIPE_API_KEY=

# My SQL
MYSQL_HOST=
MYSQL_PORT=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=

# MSSQL
QUANTREX_SERVER=
QUANTREX_DATABASE=
QUANTREX_USER=
QUANTREX_PASSWORD=
QUANTREX_PORT=
QUANTREX_REQUEST_TIMEOUT=
QUANTREX_POOL_MAX=
QUANTREX_POOL_MIN=
QUANTREX_IDLE_TIMEOUT=

# PINECONE 
PINECONE_ENVIRONMENT=
PINECONE_API_KEY=
PINECONE_INDEX=
PINECONE_PATH=

# ChatGPT
CHATGPT_ORGANIZATION_ID=
CHATGPT_PROJECT_ID=
CHATGPT_SECRET_TOKEN=

# NEO4J
NEO4J_URI_FREE=
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD_FREE=
NEO4J_PASSWORD=
NEO4J_DATABASE=
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