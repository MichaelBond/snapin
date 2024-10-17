import db from "mssql";
import config from '../configs/config';
import logger from "../utils/logger";

export default class MSSQLService {
  pool: any;
  isReady: boolean;
  dbSchema: string;
  options: any;

  constructor(dbSchema: string) {
    this.dbSchema = dbSchema;
    this.isReady = false;
    this.pool = null;
    this.options = config.MSSQL_QUANTREX;
    this.createPool();
  }

  // Establishes a database connection pool
  async createPool() {
    try {
      this.pool = await db.connect(this.options); // Establish the mssql database connection
      this.isReady = true;
    } catch (err) {
      console.log("Error Creating msSQL Connection:", err);
    }
  }

  // Checks if the connection is still alive, reconnects if necessary
  async isConnected() {
    if (!this.pool.connected) {
      await this.createPool();
      logger.info("Connection re-established");
    }
    return this.isReady;
  }

  // Executes an SQL query with optional parameters
  async execQuery(query: string, parameters?: any) {
    /*
      query format:
        'select top 1 * from swpro.dbo.swAuthTable where username = @username'
      params format:
        { "username": { "type": "NVarChar", "size": 255, "value": "mike@quantrex.com" } }
    */

    logger.debug("MSSQL:Query", query, parameters);

    if (query.length === 0) {
      return { err: "No Query", data: null };
    }

    let oParameters = null;
    let results = [];

    try {
      await this.isConnected();
      const pool = this.pool;
      const request = pool.request();

      if (parameters) {
        oParameters = typeof parameters === "string" ? JSON.parse(parameters) : parameters;
        this.prepParameters(request, oParameters);
      }

      const response = await request.query(query); // Execute the query string

      if (response && response.recordset) {
        results = response.recordset;
        return { err: null, data: results };
      }

      return { err: null, data: "Successful" };
    } catch (err: any) {
      logger.error(`Error executing msSQL Query: ${query}`, {
        parameters,
        parsedParameters: oParameters,
        error: err,
      });

      if (err.code === "ECONNCLOSED") {
        await this.isConnected();
      }

      return { err: err, data: null };
    }
  }

  // Prepares the query parameters
  prepParameters(request: any, params: any) {
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
            logger.debug(paramName, param.type, param.size, param.value);
            request.input(paramName, db[param.type](param.size), param.value);
          } else {
            request.input(paramName, db[param.type], param.value);
          }
        }
      }
    }

    logger.debug("REQUEST PARAMETERS:", request.parameters);
  }

  // Executes a query based on cube options
  async getCubeQuery(options: any) {
    const CubeId = options.cubeId;
    const CubeQuery = `select CubeID, ReadQuery, TypeAccessID from [${this.dbSchema}].[dbo].[swCubes] where CubeID=${CubeId}`;
    const results: any = await this.execQuery(CubeQuery);

    if (results.err) {
      logger.error("Error Executing Cube", CubeQuery, results.err);
      return results;
    }

    if (results?.data?.length > 0) {
      const CubeAccess = results.data[0].TypeAccessID;
      const UserAccess = options?.user?.data?.local?.accesslevel || "65535"; // temporary access level

      if (CubeAccess & UserAccess) {
        let query = results.data[0].ReadQuery;
        query = decodeURIComponent(query).replace(/\^/g, "'");
        return { err: null, data: query };
      }
      return { err: "Insufficient Access Level", data: null };
    } else {
      return { err: "No Query Selected", data: null };
    }
  }

  // Executes a stored procedure with optional parameters
  async execProcedure(procedureName: string, parameters?: any) {
    try {
      await this.isConnected();
      const pool = this.pool;
      const request = pool.request();

      if (parameters) {
        const params = typeof parameters === "string" ? JSON.parse(parameters) : parameters;
        await this.prepParameters(request, params);
      }

      const response = await request.execute(procedureName);

      if (response?.recordset) {
        return { err: null, data: response.recordset };
      }

      return { err: null, data: [] };
    } catch (err: any) {
      logger.error(`Error executing msSQL stored procedure: ${procedureName}`, {
        error: err,
        parameters,
      });

      if (err.code === "ECONNCLOSED") {
        await this.isConnected();
      }

      return { err: err, data: null };
    }
  }

  // Extracts the parameters from content
  async extractParameters(content: any) {
    const parameters: any = {};
    for (const key in content) {
      if (content.hasOwnProperty(key)) {
        parameters[key] = { type: this.getVarType(content[key]), value: content[key] };
      }
    }
    return parameters;
  }

  // Executes a stored procedure with formatting
  async formattedProcedure(procedureName: string, params: any, format: any) {
    const results = await this.execProcedure(procedureName, params);
    return format(results);
  }

  // Executes a query with formatting
  async formattedQuery(procedureName: string, params: any, format: any) {
    const results = await this.execQuery(procedureName, params);
    return format(results);
  }

  // Determines the appropriate SQL data type for a given value
  async getVarType(value: any) {
    if (typeof value === "number") {
      return Number.isInteger(value) ? "Int" : "Decimal";
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
    } else {
      return "NVarChar"; // Fallback to NVARCHAR for unsupported types
    }
  }
}
