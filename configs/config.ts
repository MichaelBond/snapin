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

        MSSQL_QUANTREX: {
            server: process.env.QUANTREX_SERVER,
            database: process.env.QUANTREX_DATABASE,
            user: process.env.QUANTREX_USER,
            password: process.env.QUANTREX_PASSWORD,
            port: process.env.QUANTREX_PORT,
            requestTimeout: process.env.QUANTREX_REQUEST_TIMEOUT,
            pool: {
              max: process.env.QUANTREX_POOL_MAX,
              min: process.env.QUANTREX_POOL_MIN,
              idleTimeoutMillis: process.env.QUANTREX_IDLE_TIMEOUT
            },
            options: {
              trustServerCertificate: true,
              enableArithAbort: true,
            }
         }
    },
    test: {},
    prod: {}
}

export default configs[env]
