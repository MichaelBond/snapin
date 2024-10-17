
import fs from "fs"
import dotenv from 'dotenv';
dotenv.config()
import logger from '../utils/logger'

type Environment = "docker" | "dev" | "test" | "prod"

const env = process.env?.ENV as Environment

const getMYSQLCert = () => {
    return env === "docker" ? null : fs.readFileSync("../ssl/DigiCertGlobalRootCA.crt.pem")
}

const configs: Record<Environment, any> = {
    docker: {
        SNAPIN_SESSION_SECRET: "alksnfkafdn",
        SNAPIN_WEBPORT: 4000,
        STRIPE_API_KEY: process.env.STRIPE_API_KEY,
        ENV: env,
        MYSQL_GTM: {
            connectionLimit: 20,
            connectionTimeout: 100000,
            host: "localhost",
            port: 3306,
            user: "user",
            password: "YourStrong!Passw0rd",
            database: "exampledb",
        },
        MSSQL_QUANTREX: {
            server: "localhost",
            database: "msdb",
            user: "sa",
            password: "Password123!",
            port: 1433,
            requestTimeout: 90000,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30
            },
            options: {
                trustServerCertificate: true,
                encrypt: false
            }
        }
    },
    dev: {
        SNAPIN_SESSION_SECRET: process.env.SNAPIN_SESSION_SECRET,
        SNAPIN_WEBPORT: process.env.SNAPIN_WEBPORT,
        STRIPE_API_KEY: process.env.STRIPE_API_KEY,
        ENV: env,
        MYSQL_GTM: {
            connectionLimit: 20,
            connectionTimeout: 100000,
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT as string, 10),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            ssl: {
                ca: getMYSQLCert()
            }
        },
        MSSQL_QUANTREX: {
            server: process.env.QUANTREX_SERVER,
            database: process.env.QUANTREX_DATABASE,
            user: process.env.QUANTREX_USER,
            password: process.env.QUANTREX_PASSWORD,
            port: parseInt(process.env.QUANTREX_PORT as string, 10),
            requestTimeout: parseInt(process.env.QUANTREX_REQUEST_TIMEOUT as string, 10),
            pool: {
                max: parseInt(process.env.QUANTREX_POOL_MAX as string, 10),
                min: parseInt(process.env.QUANTREX_POOL_MIN as string, 10),
                idleTimeoutMillis: parseInt(process.env.QUANTREX_IDLE_TIMEOUT as string, 10)
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
        },
        NEO4J: {
            uriFree: process.env.NEO4J_URI_FREE,
            uri: process.env.NEO4J_URI,
            userName: process.env.NEO4J_USERNAME,
            passwordFree: process.env.NEO4J_PASSWORD_FREE,
            password: process.env.NEO4J_PASSWORD,
            database: process.env.NEO4J_DATABASE
        }
    },
    test: {},
    prod: {}
}

logger.debug(JSON.stringify(configs[env]))
export default configs[env]
