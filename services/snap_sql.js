var fs = require("fs");
var settings = require("../../config/settings");
const db = require("mssql");
const mysql = require("mysql");
const neo4j = require("neo4j-driver");
//const mysql2 = require('mysql2/promise');  need to install mysql2
//const { MongoClient } = require('mongodb'); need to install mongodb
const debug = false;
const logAction = (action, procedureQuery, params) => {
  if (debug) {
    console.log(action, procedureQuery, params);
  }
};
const initializePools = () => {
  if (!MSSQL.isReady) {
    MSSQL.createPool();
  }
  if (!MYSQL.isReady) {
    MYSQL.createPool();
  }
  if (!NEO4J.isReady) {
    NEO4J.createDriver();
  }
};

const MSSQL = {
  pool: null,
  isReady: false,
  dbSchema: "SmartWeb",
  host: "", // DBCluster endpoint
  createPool: async function () {
    try {
      this.pool = await db.connect(settings.dbConfig.quantrex); // Establish the mssql database connection
      this.isReady = true;
    } catch (err) {
      console.log("Error Creating msSql Connection:", err);
    }
  },
  isConnected: async function () {
    if (this.pool.connected) {
      return true;
    }
    await this.createPool();
    console.log("Connection re-established");
  },
  getCubeQuery: async function (options) {
    const CubeId = options.cubeId;
    const CubeQuery = `select CubeID, ReadQuery, TypeAccessID from [${this.dbSchema}].[dbo].[swCubes] where CubeID=${CubeId}`;
    const results = await MSSQL.execQuery(CubeQuery);
    if (results.err) {
      console.log("Error Executing Cube", CubeQuery, results.err);
      return results;
    }
    //console.log(results, options.user.data.local.accesslevel);
    if (results && results.data && results.data.length > 0) {
      const CubeAccess = results.data[0].TypeAccessID;
      const UserAccess = options.user.data.local.accesslevel;
      if (CubeAccess & UserAccess) {
        let query = results.data[0].ReadQuery;
        query = decodeURIComponent(query);
        query = query.replace(/\^/g, "'");
        //console.log("QUERY: ", query);
        return { err: null, data: query };
      }
      return { err: "Insufficient Access Level", data: null };
    } else {
      return { err: "No Query Selected", data: null };
    }
  },
  extractParameters: function (body) {
    let parameters = {};
    for (let key in body) {
      parameters[key] = { type: this.getVarType(body[key]), value: body[key] };
    }
    return parameters;
  },
  findOutParameters: function (parameters) {
    let outputParameterName = null;

    for (const key in inputObject) {
      if (inputObject[key].output === true) {
        outputParameterName = key;
        break;
      }
    }
    return outputParameterName;
  },
  execProcedure: async function (procedureName, parameters) {
    /*
        params = {
            userUUID: { type: 'uniqueIdentifier', value: ""}
            fromNumber: { type: 'Numeric', size : 15, decimal: 3, value: "4440000.000"}
            toNumber: { type: 'NVarChar', size: 15, value: "4440233444"}
        }
        */
    logAction("MSSQL:Procedure", procedureName, parameters);
    try {
      await this.isConnected();
      const pool = this.pool;
      const request = pool.request();
      var results = [];
      if (parameters) {
        const params =
          typeof parameters === "string" ? JSON.parse(parameters) : parameters;
        await this.prepParameters(request, params);
        //console.log(request);
      }
      const response = await request.execute(procedureName); // Execute the stored procedure
      if (response && response.recordset) {
        results = response.recordset;
        //console.log("Stored procedure execution result:", response);
        return { err: null, data: results };
      }
    } catch (err) {
      console.log(
        `Error executing msSQL stored procedure: ${procedureName}`,
        err
      );
      if (err.code === "ECONNCLOSED") {
        await this.isConnected();
      }
      return { err: err, data: null };
    }
  },
  prepParameters: async function (request, params) {
    //console.log("Preparing Parameters:", params);
    for (const paramName in params) {
      if (params.hasOwnProperty(paramName)) {
        const param = params[paramName];
        if (param.size === -1) {
          param.size = "MAX";
        }
        if (param.output) {
          if (param.size) {
            request.output(paramName, db[param.type](param.size), param.value);
          } else {
            request.output(paramName, db[param.type], param.value);
          }
        } else {
          if (param.size) {
            //console.log(paramName, param.type, param.size, param.value);
            request.input(paramName, db[param.type](param.size), param.value);
          } else {
            request.input(paramName, db[param.type], param.value);
          }
        }
        //this.setType(request, { name: paramName, item: param });
      }
    }
    //console.log("REQUEST PARAMETERS: ", request.parameters);
  },
  execQuery: async function (query, parameters) {
    /*
      query format 'select top 1 * from swpro.dbo.swAuthTable where username = @username'
      params format { "username": { "type": "NVarChar", "size": 255, "value": "mike@quantrex.com"}}
    */

    logAction("MSSQL:Query", query, parameters);
    if (query.length === 0) {
      return { err: "No Query", data: null };
    }
    try {
      await this.isConnected();
      const pool = this.pool;
      const request = pool.request();
      var oParameters = null;
      var results = [];
      if (parameters) {
        oParameters =
          typeof parameters === "string" ? JSON.parse(parameters) : parameters;
        //console.log("Prep Parameters:", oParameters);
        await this.prepParameters(request, oParameters);
      }
      const response = await request.query(query); // Execute the query string
      if (response && response.recordset) {
        results = response.recordset;
        // console.log("Query execution result:", results);
        return { err: null, data: results };
      }
      return { err: null, data: "Successful" };
    } catch (err) {
      console.log(
        `Error executing msSQL Query:  ${query}`,
        parameters,
        oParameters,
        err
      );
      if (err.code === "ECONNCLOSED") {
        await this.isConnected();
      }
      return { err: err, data: null };
    }
  },
  formattedProcedure: async function (procedureName, params, format) {
    const results = await this.execProcedure(procedureName, params);
    return format(results);
  },
  formattedQuery: async function (procedureName, params, format) {
    const results = await this.execQuery(procedureName, params);
    return format(results);
  },
  getVarType(value) {
    if (typeof value === "number") {
      if (Number.isInteger(value)) {
        return "Int";
      } else {
        return "Decimal";
      }
    } else if (typeof value === "string") {
      return "NVarChar";
    } else if (typeof value === "boolean") {
      return "Bit";
    } else if (value instanceof Date) {
      return "DateTime";
    } else if (value instanceof Buffer) {
      return "VarBinary";
    } else if (value instanceof Array) {
      return "Int";
    } else if (value === null) {
      return "NVarChar";
    } // Assuming the database column allows NULL values of type NVARCHAR
    else {
      return "NVarChar";
    } // Fallback to NVARCHAR for unsupported types
  },
};
const MYSQL = {
  pool: null,
  isReady: false,
  host: "", // DBCluster endpoint
  createPool: async function () {
    try {
      settings.dbConfig.azure["ssl"] = {
        ca: fs.readFileSync(
          "/home/ec2-user/snapin/ssl/DigiCertGlobalRootCA.crt.pem"
        ),
      };
      settings.dbConfig.azure["connectionLimit"] = 20;
      settings.dbConfig.azure["connectionTimeout"] = 100000;
      this.pool = mysql.createPool(settings.dbConfig.azure);
      this.isReady = true;
    } catch (err) {
      console.log("Error Creating mySql Connection", err);
    }
  },
  isConnected: async function () {
    if (this.pool) {
      return true;
    }
    this.createPool();
  },
  extractParameters: function (body) {
    let parameters = [];
    for (let key in body) {
      parameters.push(body[key]);
    }
    return parameters;
  },
  findOutParameters: function () {
    let outputParameterName = null;

    for (const key in inputObject) {
      if (inputObject[key].output === true) {
        outputParameterName = key;
        break;
      }
    }
    return outputParameterName;
  },

  execProcedure: async function (procedureCall, params) {
    const pool = this.pool;

    logAction("MYSQL:Procedure", procedureCall, params);
    let query = `CALL ${procedureCall}(`;
    let results = null;
    let response = null;
    let value = null;
    let item = null;
    let outputParameter = null;

    //console.log("PROCEDURE PARAMS: ", params);
    for (key in params) {
      value = "";
      item = params[key];
      if (item.output) {
        outputParameter = key;
        value = key;
      } else {
        if (item.type === "numeric") {
          value = item.value.toString();
        } else if (item.type === "json") {
          if (typeof item.value === "string") {
            value = `'${item.value}'`;
          } else {
            value = `'${JSON.stringify(item.value)}'`;
          }
        } else {
          value = `'${item.value}'`;
        }
      }
      query += ` ${value},`;
    }
    query = query.slice(0, -1);
    query += ")";
    //console.log("MYSQL PROCEDURE: ", query);
    try {
      results = await new Promise((resolve, reject) => {
        pool.query(query, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      if (outputParameter) {
        response = await new Promise((resolve, reject) => {
          pool.query(`SELECT ${outputParameter}`, (error, results) => {
            if (error) reject(error);
            else resolve(results);
          });
        });
        //console.log("Response: ", response);
        return { err: null, data: response };
      } else {
        //console.log("Response: ", results);
        return { err: null, data: results };
      }
    } catch (err) {
      console.log(`Error executing mySQL Query: ${query}`, err);
      return { err: err, data: null };
    }
  },

  execQuery: async function (query, parameters) {
    /*
      query format 'select top 1 * from swpro.dbo.swAuthTable where username = @username'
      params format { "username": { "type": "NVarChar", "size": 255, "value": "mike@quantrex.com"}}
    */
    const pool = this.pool;
    var results = [];
    var response = [];
    let params = [];

    if (query.substring(0, 4) !== "CALL") {
      logAction("MYSQL:Query", query, parameters);
    }
    if (parameters && parameters.length > 0) {
      const paramsJson =
        typeof parameters === "string" ? JSON.parse(parameters) : parameters;
      //console.log(paramsJson);
      params = paramsJson;
      //const prepped = await this.prepParameters(paramsJson);
      //params = Object.values(prepped.params);
      query = query.replace(/\n/g, " ");
      for (key in params) {
        item = params[key];
       // console.log("MYSQL VARIABLES: ", typeof item, item);
        if (typeof item === "string") {
          query = query.replace("?", `'${item}'`);
        } else {
          query = query.replace("?", `${item}`);
        }
      }
     // console.log("MYSQL PARAMETERS: ", params, query);
    }
    try {
      const results = await new Promise((resolve, reject) => {
        if (params && params.length > 0) {
          /*
          console.log(
            "QUERY: ------------------------------------------",
            query,
            params,
            "--------------------------------"
          );
          */
          pool.query(query, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        } else {
          pool.query(query, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        }
      });

      //console.log("Query results:", results);
      return { err: null, data: results };
    } catch (err) {
      console.log(`Error executing mySQL Query:  ${query}`, err);
      return { err: err, data: null };
    }
  },
  formattedProcedure: async function (procedureName, params, format) {
    const results = await this.execProcedure(procedureName, params);
    return format(results);
  },
  formattedQuery: async function (procedureName, params, format) {
    const results = await this.execQuery(procedureName, params);
    return format(results);
  },
  prepParameters: async function (params) {
    var output = null;
    var parameters = [];
    for (key in params) {
      item = params[key];
      if (item.output) {
        output = key;
      } else {
        parameters.push(item.value);
      }
    }
    return { params: parameters, output: output };
  },
};
const NEO4J = {
  driver: null,
  isReady: false,
  dbSchema: "SmartWeb",
  host: "", // DBCluster endpoint
  createDriver: async function () {
    const URI = process.env.NEO4J_URI;
    const USER = process.env.NEO4J_USERNAME;
    const PASSWORD = process.env.NEO4J_PASSWORD;

    try {
      this.driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
      const serverInfo = await this.driver.getServerInfo();
      console.log("Connection established");
      console.log(serverInfo);
      this.isReady = true;
    } catch (err) {
      console.log(`Connection error\n${err}\nCause: ${err.cause}`);
      await this.driver.close();
      return;
    }
  },
  isConnected: async function () {
    if (this.driver) {
      return true;
    }
    await this.createDriver();
    console.log("Connection re-established");
  },
  closeDriver: function () {
    this.isReady = false;
    this.driver.close();
  },
  getCubeQuery: async function (options) {
    const CubeId = options.cubeId;
    const CubeQuery = `select CubeID, ReadQuery, TypeAccessID from [${this.dbSchema}].[dbo].[swCubes] where CubeID=${CubeId}`;
    const results = await MSSQL.execQuery(CubeQuery);
    if (results.err) {
      console.log("Error Executing Cube", CubeQuery, err);
      return results;
    }
    //console.log(results, options.user.data.local.accesslevel);
    if (results && results.data && results.data.length > 0) {
      const CubeAccess = results.data[0].TypeAccessID;
      const UserAccess = options.user.data.local.accesslevel;
      if (CubeAccess & UserAccess) {
        let query = results.data[0].ReadQuery;
        query = decodeURIComponent(query);
        query = query.replace(/\^/g, "'");
        //console.log("QUERY: ", query);
        return { err: null, data: query };
      }
      return { err: "Insufficient Access Level", data: null };
    } else {
      return { err: "No Query Selected", data: null };
    }
  },
  prepParameters: async function (request, params) {
    //console.log("Preparing Parameters:", params);
    for (paramName in params) {
      let param = params[paramName];
      let newParam = {};
      newParam[paramName] = param.value;
      request.push(newParam);
    }
    //console.log("REQUEST PARAMETERS: ", request.parameters);
  },
  execQuery: async function (query, readWrite) {
    /*
      query format 'select top 1 * from swpro.dbo.swAuthTable where username = @username'
      params format { "username": { "type": "NVarChar", "size": 255, "value": "mike@quantrex.com"}}
    */
    let dataObject = null;
    logAction("NEO4J:Query", query);
    if (query.length === 0) {
      return { err: "No Query", data: null };
    }
    try {
      await this.isConnected();

      const driver = this.driver;
      const session = driver.session({ database: process.env.NEO4J_DATABASE });
      var results = [];
      let result = null;

      // Transaction Session
      if (readWrite === "write") {
        result = await session.executeWrite(async (tx) => {
          return await tx.run(query);
        });
      } else if (readWrite === "read") {
        result = await session.executeRead(async (tx) => {
          return await tx.run(query);
        });
      }
      //console.log(result);
      results = result.records;
      dataObject = { err: null, data: results };
    } catch (err) {
      console.log(`Error executing Neo4j Query:  ${query}`, err);
      dataObject = { err: err, data: null };
    } finally {
      // console.log(dataObject);
      if (typeof session !== "undefined") {
        await session.close();
      }
      return dataObject;
    }
  },
  execQueryBatch: async function (queries, readWrite) {
    logAction("NEO4J:Batch", queries);
    if (queries.length === 0) {
      return { err: "No Query", data: null };
    }
    try {
      await this.isConnected();

      const driver = this.driver;
      const session = driver.session({ database: process.env.NEO4J_DATABASE });
      var results = [];
      let result = null;
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
            const queryResults = [];
            queries.forEach(async (query) => {
              const result = await tx.run(query.query, query.params);
              queryResults.push(result);
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
      console.log(`Error executing Neo4j Query:  ${query}`, err);
      return { err: err, data: null };
    }
  },
};
/* const AURORA = {
    pool: null,
    isReady: false,
    host: '', // DBCluster endpoint

    createPool: async function() {
        try {
            settings.dbConfig.aurora["ssl"] = {
                ca: fs.readFileSync("/home/ec2-user/snapin/ssl/DigiCertGlobalRootCA.crt.pem"),
            };
            settings.dbConfig.aurora["connectionLimit"] = 20;
            settings.dbConfig.aurora["connectTimeout"] = 100000;

            AURORA.pool = await mysql2.createPool(settings.dbConfig.aurora);
            AURORA.isReady = true;
        } 
        catch (err) {
            console.error('Error creating Aurora RDS pool:', err);
        }
    },
    execProcedure: async function(procedureName, params) {
        logAction('Aurora:Procedure', procedureName, params);
        return await AURORA.execQuery(procedureName, params);
    },
    execQuery: async function(query, params) {
        const pool = AURORA.pool;
        let results = [];
        if (query.substring(0, 4) !== "CALL") {
            logAction('Aurora:Query', query, params);
        }

        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.execute(query, params);
            results = rows;
            connection.release();
            console.log("Query execution results:", results);
        } catch (err) {
            console.error("Error executing Aurora SQL query:", err);
        }

        return results;
    },
    formattedProcedure: async function(procedureName, params, format) {
        const results = await this.execProcedure(procedureName, params);
        return( format(results));
    },
    formattedQuery: async function(procedureName, params, format) {
        const results = await this.execQuery(procedureName, params);
        return( format(results));
    }
};
*/
/* const MONGODB = {
    client: null,
    isReady: false,
  
    createPool: async function() {
      try {
        settings.mongodb.sslCA = fs.readFileSync('/path/to/ca.crt.pem');
  
        MONGODB.client = await MongoClient.connect(settings.mongodb.url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          sslCA: settings.mongodb.sslCA,
          poolSize: settings.mongodb.poolSize,
          connectTimeoutMS: settings.mongodb.connectTimeout,
        });
  
        MONGODB.isReady = true;
      } catch (err) {
        console.error('Error creating MongoDB connection pool:', err);
      }
    },
  
    execProcedure: async function(procedureName, params) {
      console.warn('MongoDB does not support stored procedures.');
      return [];
    },
  
    execQuery: async function(collectionName, filter) {
      if (!MONGODB.isReady) {
        console.error('MongoDB connection pool is not established.');
        return [];
      }
  
      try {
        const collection = MONGODB.client.db().collection(collectionName);
        const documents = await collection.find(filter).toArray();
        console.log('Query execution results:', documents);
        return documents;
      } catch (err) {
        console.error('Error executing MongoDB query:', err);
        return [];
      }
    }
};
*/
initializePools();

module.exports = {
  MSSQL,
  MYSQL,
  NEO4J,
  //   AURORA,
  //   MONGODB,
  initializePools,
  logAction,
};
