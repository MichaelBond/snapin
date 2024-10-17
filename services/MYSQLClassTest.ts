import mysql from "mysql2/promise";
import config from '../configs/config';
import logger from "../utils/logger";

export default class MySQLService {
  pool: any;
  isReady: boolean;
  dbSchema: string;
  options: any;

  constructor(dbSchema: string) {
    this.dbSchema = dbSchema;
    this.isReady = false;
    this.pool = null;
    this.options = config.MYSQL_QUANTREX; // Assuming you have MySQL configuration in your config file
    this.createPool();
  }

  // Establish a MySQL connection pool
  async createPool() {
    try {
      this.pool = await mysql.createPool(this.options); // Create MySQL connection pool
      this.isReady = true;
      logger.info("MySQL connection pool created successfully");
    } catch (err) {
      logger.error("Error creating MySQL connection pool:", err);
    }
  }

  // Checks if the pool is ready, reconnects if necessary
  async isConnected() {
    try {
      const [rows] = await this.pool.query('SELECT 1');
      return rows ? true : false;
    } catch (err) {
      logger.error("MySQL connection lost, re-establishing...");
      await this.createPool();
      return this.isReady;
    }
  }

  // Executes a SQL query with optional parameters
  async execQuery(query: string, parameters?: any) {
    logger.debug("MySQL:Query", query, parameters);

    if (query.length === 0) {
      return { err: "No Query", data: null };
    }

    let results = [];
    try {
      await this.isConnected();

      // Execute query
      const [rows] = await this.pool.execute(query, parameters);
      results = rows;

      return { err: null, data: results };
    } catch (err: any) {
      logger.error(`Error executing MySQL query: ${query}`, {
        error: err,
        parameters,
      });

      return { err: err, data: null };
    }
  }

  // Prepares query parameters
  async prepParameters(parameters: any) {
    // This method is simplified for MySQL, since the `mysql2` package handles parameter binding automatically
    logger.debug("Preparing MySQL query parameters", parameters);
    return parameters;
  }

  // Executes a stored procedure with optional parameters
  async execProcedure(procedureName: string, parameters?: any) {
    try {
      await this.isConnected();

      const query = `CALL ${procedureName}(${this.getProcedurePlaceholders(parameters)})`;
      const preppedParameters = await this.prepParameters(parameters);

      const [rows] = await this.pool.execute(query, preppedParameters);

      return { err: null, data: rows };
    } catch (err: any) {
      logger.error(`Error executing MySQL stored procedure: ${procedureName}`, {
        error: err,
        parameters,
      });

      return { err: err, data: null };
    }
  }

  // Generates a string of placeholders for MySQL procedures based on the parameters
  getProcedurePlaceholders(parameters: any) {
    if (!parameters || Object.keys(parameters).length === 0) {
      return '';
    }
    return Object.keys(parameters).map(() => '?').join(', ');
  }

  // Executes a query based on options and cube id
  async getCubeQuery(options: any) {
    const CubeId = options.cubeId;
    const CubeQuery = `SELECT CubeID, ReadQuery, TypeAccessID FROM ${this.dbSchema}.swCubes WHERE CubeID=?`;
    const results: any = await this.execQuery(CubeQuery, [CubeId]);

    if (results.err) {
      logger.error("Error executing cube query:", CubeQuery, results.err);
      return results;
    }

    if (results?.data?.length > 0) {
      const CubeAccess = results.data[0].TypeAccessID;
      const UserAccess = options?.user?.data?.local?.accesslevel || "65535"; // Temporary access level

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

  // Extracts the parameters from content
  async extractParameters(content: any) {
    const parameters: any = {};
    for (const key in content) {
      if (content.hasOwnProperty(key)) {
        parameters[key] = content[key];
      }
    }
    return parameters;
  }

  // Executes a stored procedure and formats the results
  async formattedProcedure(procedureName: string, params: any, format: any) {
    const results = await this.execProcedure(procedureName, params);
    return format(results);
  }

  // Executes a query and formats the results
  async formattedQuery(query: string, params: any, format: any) {
    const results = await this.execQuery(query, params);
    return format(results);
  }

  // Determines the SQL data type for a given value (optional for MySQL)
  async getVarType(value: any) {
    if (typeof value === "number") {
      return Number.isInteger(value) ? "INT" : "DECIMAL";
    } else if (typeof value === "string") {
      return "VARCHAR";
    } else if (typeof value === "boolean") {
      return "TINYINT"; // MySQL uses TINYINT(1) for boolean values
    } else if (value instanceof Date) {
      return "DATETIME";
    } else if (value instanceof Buffer) {
      return "BLOB";
    } else if (value instanceof Array) {
      return "VARCHAR"; // Simplification for array data
    } else if (value === null) {
      return "VARCHAR"; // Default for null values
    } else {
      return "VARCHAR"; // Fallback for unsupported types
    }
  }
}
