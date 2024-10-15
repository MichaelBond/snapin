import express from 'express';
import * as handler from '../handlers/snapInHandler'
import logger from "../utils/logger";

const mssqlRouter = express.Router();

mssqlRouter.get('/test', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mssqlTest(req, res); 
        res.send(response);
    } catch (err) {
        res.status(500).send(err)        
    }
})

mssqlRouter.get('/lead', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mysqlTest(req, res); 
        res.send(response);
    } catch (err) {
        res.status(500).send(err)        
    }
})

export default mssqlRouter
