import logger from '../utils/logger'
import { Request, Response, NextFunction } from 'express'

export default (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info(`Request: [Path]:${req.url}`)
        if (req.body) {
            logger.info(`[Body]: ${JSON.stringify(req.body)}`)
        }
    } catch (err) {
        logger.error("Failed to parese Request: ", err)
    }
    // find a way to eventually log the status code of the response 
    res.on('finish', () => {
        logger.info(`[StatusCode]: ${res.statusCode}`)
    })
    req.on('error', function (e) {
        logger.error('Request had Error: ' + e.message);
    });
    next()
}