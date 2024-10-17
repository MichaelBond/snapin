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
mssqlRouter.get('/test', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mssqlTest(); 
        res.send(response);
    } catch (err) {
        res.status(500).send(err)        
    }
})
mssqlRouter.get('/chat', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.chatgptTest(); 
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

mssqlRouter.get('/neo4j/cube/:id', async (req: express.Request, res: express.Response) => {
    try {
        console.log(req.params.id)
        const response = await handler.neo4jCube({id: req.params.id}); 
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
        const response = await handler.mysqlCube({ id: req.params.id, params: params}); 
        res.send(response);
    } catch (err) {
        console.log(err);
        res.status(500).send(err)        
    }
})

mssqlRouter.post("/crm/db/query/:id", async (req, res) => {
    const options = {
      cubeId: req.params.id,
      user: 33,
    };

    try {
        const results = await handler.crmDbQuery(options, req.body)
        res.status(200).json(results.data);
    }
    catch (err: any) {
        res.status(err.status || 500).send(err.data)
    }
});
export default mssqlRouter
