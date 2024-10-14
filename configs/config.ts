import dotenv from 'dotenv';
dotenv.config()

type Environment = "dev" | "test" | "prod"

const env = process.env?.ENV as Environment

const configs: Record<Environment, any> = {
    dev: {
        SNAPIN_SESSION_SECRET: process.env.SNAPIN_SESSION_SECRET,
        SNAPIN_WEBPORT: process.env.SNAPIN_WEBPORT,
        STRIPE_API_KEY: process.env.STRIPE_API_KEY,
        ENV: env
    },
    test: {},
    prod: {}
}

export default configs[env]
