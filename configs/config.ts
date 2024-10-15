
import fs from "fs"
import dotenv from 'dotenv';
dotenv.config()

type Environment = "dev" | "test" | "prod"

const env = process.env?.ENV as Environment

const configs: Record<Environment, any> = {
    dev: {
        SNAPIN_SESSION_SECRET: process.env.SNAPIN_SESSION_SECRET,
        SNAPIN_WEBPORT: process.env.SNAPIN_WEBPORT,
        STRIPE_API_KEY: process.env.STRIPE_API_KEY,
        ENV: env,
        MYSQL_GTM: {
            connectionLimit: 20,
            connectionTimeout: 100000,
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT as string,10),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            ssl: {
                ca: fs.readFileSync("./ssl/DigiCertGlobalRootCA.crt.pem"),
            }
        },

        MSSQL_QUANTREX: {
            server: process.env.QUANTREX_SERVER,
            database: process.env.QUANTREX_DATABASE,
            user: process.env.QUANTREX_USER,
            password: process.env.QUANTREX_PASSWORD,
            port: parseInt(process.env.QUANTREX_PORT,10),
            requestTimeout: parseInt(process.env.QUANTREX_REQUEST_TIMEOUT,10),
            pool: {
              max: parseInt(process.env.QUANTREX_POOL_MAX,10),
              min: parseInt(process.env.QUANTREX_POOL_MIN,10),
              idleTimeoutMillis: parseInt(process.env.QUANTREX_IDLE_TIMEOUT,10)
            },
            options: {
              trustServerCertificate: true,
              enableArithAbort: true,
            }
        },

        PINECONE: {
            environment: process.env.PINECONE_ENVIRONMENT,
            apiKey: process.env.PINECONE_API_KEY,
            indexName: process.env.PINECONE_INDEX,
            pathName: process.env.PINECONE_PATH
        },
        CHATGPT: {
            organizationId: process.env.CHATGPT_ORGANIZATION_ID,
            projectId: process.env.CHATGPT_PROJECT_ID,
            apiKey: process.env.CHATGPT_SECRET_TOKEN
        }

    },
    test: {},
    prod: {}
}
console.log(configs)
export default configs[env]
