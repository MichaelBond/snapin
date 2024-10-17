import logger from '../utils/logger'
import NEO4JServiceClass from "../services/NEO4JClass"

const NEO4J = new NEO4JServiceClass()

export const getQuery = async (query: string) => {
    logger.debug(`getQuery`, query)
    return await NEO4J.execQuery(query, "read");
}
