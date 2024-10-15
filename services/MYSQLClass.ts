import db from "mysql"
import config from '../configs/config'
import logger from "../utils/logger"
import fs from "fs"

export default class MYSQLService {
  pool: any
  isReady: boolean
  dbSchema: string
  options: any

  
  constructor(dbSchema: string) {
    this.dbSchema = dbSchema
    this.isReady = false
    this.pool = null
    this.options = config.MYSQL_GTM
    this.createPool();
  }
  async createPool() {
    try {
      this.pool = db.createPool(this.options);
      this.isReady = true;
    } catch (err) {
      console.log("Error Creating mySql Connection", err);
    }
  }

  async isConnected() {
    if (this.pool) {
      return true;
    }
    this.createPool();
  }

  extractParameters(content: any) {
    let parameters:any[] = [];
    for (let key in content) {
      parameters.push(content[key]);
    }
    return parameters;
  }

  async execProcedure(procedureCall: string, params: any) {
    const pool = this.pool;

    logger.debug("MYSQL:Procedure", procedureCall, params);
    let query = `CALL ${procedureCall}(`;
    let results = null
    let response = null
    let outputParameter = ""

    //console.log("PROCEDURE PARAMS: ", params);
    for (let key in params) {
      let value = "";
      let item = params[key];
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
  }

  async execQuery(query: string, parameters: any) {
    /*
      query format 'select top 1 * from swpro.dbo.swAuthTable where username = @username'
      params format { "username": { "type": "NVarChar", "size": 255, "value": "mike@quantrex.com"}}
    */
    const pool = this.pool;
    var results = [];
    var response = [];
    let params = [];

    if (query.substring(0, 4) !== "CALL") {
      logger.debug("MYSQL:Query", query, parameters);
    }
    if (parameters && parameters.length > 0) {
      const paramsJson =
        typeof parameters === "string" ? JSON.parse(parameters) : parameters;
      //console.log(paramsJson);
      params = paramsJson;
      //const prepped = await this.prepParameters(paramsJson);
      //params = Object.values(prepped.params);
      query = query.replace(/\n/g, " ");
      for (let key in params) {
        let item = params[key];
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
  }

  async formattedProcedure(procedureName: string, params: any, format: Function) {
    const results = await this.execProcedure(procedureName, params);
    return format(results);
  }

  async formattedQuery(procedureName: string, params: any, format: Function) {
    const results = await this.execQuery(procedureName, params);
    return format(results);
  }

  async prepParameters(params: any) {
    var output = "";
    var parameters: any[] = [];
    for (let key in params) {
      let item = params[key];
      if (item.output) {
        output = key;
      } else {
        parameters.push(item.value);
      }
    }
    return { params: parameters, output: output };
  }
}
