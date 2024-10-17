import neo4j from "neo4j-driver"
import config from '../configs/config'
import logger from "../utils/logger"


export default class NEO4JServiceClass {
    driver: any
    isReady: boolean
    options: any
    uri: string
    userName: string
    password: string

    constructor() {
        this.uri = config.NEO4J.uri
        this.userName = config.NEO4J.userName
        this.password = config.NEO4J.password
        this.isReady = false
        this.createDriver()
    }

    async createDriver() {
        try {
            this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.userName, this.password));
            const serverInfo = await this.driver.getServerInfo();
            logger.info("Connection established");
            logger.info(serverInfo);
            this.isReady = true;
        } catch (err: any) {
            logger.error(`Connection error\n${err}\nCause: ${err.cause}`);
            await this.driver.close();
            return;
        }
    }
    async isConnected() {
        if (this.driver) {
            return true;
        }
        await this.createDriver();
        logger.info("Connection re-established");
    }

    closeDriver() {
        this.isReady = false;
        this.driver.close();
    }

    async execQuery(query: string, readWrite: string) {
        /*
          query format 'select top 1 * from swpro.dbo.swAuthTable where username = @username'
          params format { "username": { "type": "NVarChar", "size": 255, "value": "mike@quantrex.com"}}
        */
        let dataObject: any
        let session: any
        logger.info("NEO4J:Query", query);
        if (query.length === 0) {
            return { err: "No Query", data: null };
        }
        try {
            await this.isConnected();

            const driver = this.driver;
            session = driver.session({ database: config.NEO4J.database });
            var results = [];
            let result: any

            // Transaction Session
            if (readWrite === "write") {
                result = await session.executeWrite(async (tx: any) => {
                    return await tx.run(query);
                })
            }
            else if (readWrite === "read") {
                result = await session.executeRead(async (tx: any) => {
                    return await tx.run(query)
                })
            }
            if (result) {
                //console.log(result);
                results = result.records;
                dataObject = { err: null, data: results };
            }
        } catch (err) {
            logger.error(`Error executing Neo4j Query:  ${query}`, err);
            dataObject = { err: err, data: null };
        } finally {
            // console.log(dataObject);
            if (session) {
                await session.close();
            }
            return dataObject;
        }
    }
    async execQueryBatch(queries: any[], readWrite: string) {
        logger.info("NEO4J:Batch", queries);
        if (queries.length === 0) {
            return { err: "No Query", data: null };
        }
        let session: any
        let result: any
        try {
            await this.isConnected();

            const driver = this.driver;
            const session = driver.session({ database: config.NEO4J.database });
            var results = [];
            /*
            const queries = [
              { query: "MATCH (a:Person {name: 'Alice'}) SET a.age = 30" },
              { query: "MATCH (b:Person {name: 'Bob'}) SET b.location = 'New York'" },
              // Add more queries as needed
          ];
          */
            try {
                // Transaction Session
                if (readWrite === "write") {
                    results = await session.writeTransaction(async (tx) => {
                        const queryResults: any[] = [];
                        queries.forEach(async (query) => {
                            const res = await tx.run(query.query, query.params);
                            queryResults.push(res);
                        });
                        return queryResults;
                    });
                    return { err: null, data: results };
                } else if (readWrite === "read") {
                    results = await session.readTransaction(async (tx) => {
                        return await Promise.all(
                            queries.map(({ query, params }) => tx.run(query, params))
                        );
                    });
                    results = result.records;
                    return { err: null, data: results };
                }
            } catch (err) {
                return { err: err, data: null };
            } finally {
                await session.close();
            }
        } catch (err) {
            logger.error(`Error executing Neo4j Query:`, queries, err);
            return { err: err, data: null };
        }
    }
}