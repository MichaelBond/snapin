import express from 'express';
import * as handler from '../handlers/snapInHandler'

const testRouter = express.Router();

testRouter.get('/bryce', async (req, res) => {
    const data = await handler.bryceTest()
    res.send(data)
})

testRouter.get('/test', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mssqlTest();
        res.send(response);
    } catch (err) {
        res.status(500).send(err)
    }
})
testRouter.get('/test', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mssqlTest();
        res.send(response);
    } catch (err) {
        res.status(500).send(err)
    }
})
testRouter.get('/chat', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.chatgptTest();
        res.send(response);
    } catch (err) {
        res.status(500).send(err)
    }
})

testRouter.get('/cube/:id', async (req: express.Request, res: express.Response) => {
    try {
        const response = await handler.mssqlCube(req.params.id);
        res.send(response);
    } catch (err) {
        console.log(err);
        res.status(500).send(err)
    }
})

testRouter.get('/neo4j/cube/:id', async (req: express.Request, res: express.Response) => {
    try {
        console.log(req.params.id)
        const response = await handler.neo4jCube({ id: req.params.id });
        res.send(response);
    } catch (err) {
        console.log(err);
        res.status(500).send(err)
    }
})

testRouter.post('/zepcrm/cube/:id', async (req: express.Request, res: express.Response) => {
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

// testRouter.post("/crm/db/query/:id", async (req, res) => {
//     const options = {
//         cubeId: req.params.id,
//         user: 33,
//     };

//     try {
//         const results = await handler.crmDbQuery(options, req.body)
//         res.status(200).json(results.data);
//     }
//     catch (err: any) {
//         res.status(err.status || 500).send(err.data)
//     }
// });

export default testRouter
