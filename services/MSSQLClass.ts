import db from "mssql"
import config from '../configs/config'
import logger from "../utils/logger"


export default class MSSQLService {
  pool: any
  isReady: boolean
  dbSchema: string
  options: any

  constructor(dbSchema: string) {
    this.dbSchema = dbSchema
    this.isReady = false
    this.pool = null
    this.options = config.MSSQL_QUANTREX
    this.createPool();
  }
  async createPool() {
    try {
      this.pool = await db.connect(this.options); // Establish the mssql database connection
      this.isReady = true;
    } catch (err) {
      console.log("Error Creating msSql Connection:", err);
    }
  }
  async isConnected() {
    if (!this.pool.connected) {
      await this.createPool();
      logger.info("Connection re-established")
    }
    return this.isReady;
  }

  async execQuery(query: string, parameters?: any) {
    /*
      query format 'select top 1 * from swpro.dbo.swAuthTable where username = @username'
      params format { "username": { "type": "NVarChar", "size": 255, "value": "mike@quantrex.com"}}
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
        // console.log("Query execution result:", results);
        return { err: null, data: results };
      }
      return { err: null, data: "Successful" };
    }
    catch (err: any) {
      logger.error(
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
  }

  prepParameters(request: any, params: any) {
    // Log the parameters being prepared (commented out for production)
    // console.log("Preparing Parameters:", params);

    // Iterate over the parameters object
    for (const paramName in params) {
      if (params.hasOwnProperty(paramName)) {
        const param = params[paramName];

        // Handle size = -1 by setting it to "MAX"
        if (param.size === -1) {
          param.size = "MAX";
        }

        // Check if the parameter is an output parameter
        if (param.output) {
          if (param.size) {
            // Output with size
            request.output(paramName, db[param.type](param.size), param.value);
          } else {
            // Output without size
            request.output(paramName, db[param.type], param.value);
          }
        } else {
          if (param.size) {
            // Input with size, log debug info
            logger.debug(paramName, param.type, param.size, param.value);
            request.input(paramName, db[param.type](param.size), param.value);
          } else {
            // Input without size
            request.input(paramName, db[param.type], param.value);
          }
        }

        // Optionally handle type setting (if required later)
        // this.setType(request, { name: paramName, item: param });
      }
    }

    // Log the final request parameters for debugging
    logger.debug("REQUEST PARAMETERS:", request.parameters);
  }


  async getCubeQuery(options: any) {
    const CubeId = options.cubeId;
    const CubeQuery = `select CubeID, ReadQuery, TypeAccessID from [${this.dbSchema}].[dbo].[swCubes] where CubeID=${CubeId}`;
    const results: any = await this.execQuery(CubeQuery);
    if (results.err) {
      logger.error("Error Executing Cube", CubeQuery, results.err);
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
  }

  async execProcedure(procedureName: string, parameters: any) {
    /*
        Example parameters object:
        {
            userUUID: { type: 'uniqueIdentifier', value: "" },
            fromNumber: { type: 'Numeric', size: 15, decimal: 3, value: "4440000.000" },
            toNumber: { type: 'NVarChar', size: 15, value: "4440233444" }
        }
    */
    try {
      // Ensure connection is established
      await this.isConnected();
      const pool = this.pool;
      const request = pool.request();
      let results = [];

      // If parameters exist, process them
      if (parameters) {
        const params = typeof parameters === "string" ? JSON.parse(parameters) : parameters;
        await this.prepParameters(request, params);
        // console.log(request);
      }

      // Execute the stored procedure
      const response = await request.execute(procedureName);

      // If the response contains a recordset, return the results
      if (response && response.recordset) {
        results = response.recordset;
        // console.log("Stored procedure execution result:", response);
        return { err: null, data: results };
      }

      return { err: null, data: [] }; // In case no results are returned
    } catch (err: any) {
      // Enhanced error logging with more context
      logger.error(`Error executing msSQL stored procedure: ${procedureName}`, {
        error: err,
        parameters: parameters
      });

      // Retry connection if the connection was closed
      if (err.code === "ECONNCLOSED") {
        await this.isConnected();
      }

      return { err: err, data: null };
    }
  }


  async extractParameters(content: any) {
    var parameters = {}
    for (var key in content) {
      parameters[key] = { type: this.getVarType(content[key]), value: content[key] }
    }
    return parameters
  }
  // async findOutParameters(parameters: any) {
  //   let outputParameterName = null;

  //   for (const key in inputObject) {
  //     if (inputObject[key].output === true) {
  //       outputParameterName = key;
  //       break;
  //     }
  //   }
  //   return outputParameterName;
  // }

  async formattedProcedure(procedureName: string, params: any, format: any) {
    const results = await this.execProcedure(procedureName, params);
    return format(results)
  }
  async formattedQuery(procedureName: string, params: any, format: any) {
    const results = await this.execQuery(procedureName, params);
    return format(results)
  }
  async getVarType(value: any) {
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
  }
}
