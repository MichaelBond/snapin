import express from 'express';
import * as handler from '../handlers/snapInHandler'
import logger from "../utils/logger";

const mssqlRouter = express.Router();

mssqlRouter.get('/test', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mssqlTest();
        res.send(response);
    } catch (err) {
        res.status(500).send(err)
    }
})

mssqlRouter.get('/lead', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mysqlTest();
        res.send(response);
    } catch (err) {
        res.status(500).send(err)
    }
})

mssqlRouter.get('/cube/:id', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mssqlCube(req.params.id);
        res.send(response);
    } catch (err) {
        console.log(err);
        res.status(500).send(err)
    }
})

mssqlRouter.post('/zepcrm/cube/:id', async (req: express.Request, res: express.Response) => {
    try {
        const params = req.body
        console.log(req.params.id)
        const response = await handler.mysqlCube({ id: req.params.id, params: params });
        res.send(response);
    } catch (err) {
        console.log(err);
        res.status(500).send(err)
    }
})
export default mssqlRouter
