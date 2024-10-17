import { MongoClient, Db } from "mongodb";
import config from '../configs/config';
import logger from "../utils/logger";

export default class MongoDBService {
  client: MongoClient;
  db: Db | null;
  isReady: boolean;
  dbName: string;
  options: any;

  constructor(dbName: string) {
    this.dbName = dbName;
    this.isReady = false;
    this.client = new MongoClient(config.MONGO_URI, config.MONGO_OPTIONS); // MongoDB connection URI and options from config
    this.db = null;
    this.createConnection();
  }

  // Establish a MongoDB connection
  async createConnection() {
    try {
      await this.client.connect(); // Establish connection to MongoDB
      this.db = this.client.db(this.dbName); // Connect to the specified database
      this.isReady = true;
      logger.info("MongoDB connection established successfully");
    } catch (err) {
      logger.error("Error establishing MongoDB connection:", err);
    }
  }

  // Check if the MongoDB connection is alive, reconnect if necessary
  async isConnected() {
    try {
      // MongoClient maintains connection pool, use isConnected() method if available or rely on operations to throw an error if not connected
      if (!this.client.isConnected()) {
        await this.createConnection();
        logger.info("MongoDB connection re-established");
      }
      return this.isReady;
    } catch (err) {
      logger.error("MongoDB connection check failed, re-establishing connection...", err);
      await this.createConnection();
      return this.isReady;
    }
  }

  // Execute a MongoDB query on a collection
  async execQuery(collectionName: string, query: any, options?: any) {
    logger.debug("MongoDB:Query", collectionName, query, options);

    if (!query || Object.keys(query).length === 0) {
      return { err: "No Query", data: null };
    }

    let results = [];
    try {
      await this.isConnected();
      const collection = this.db?.collection(collectionName);

      if (!collection) {
        return { err: `Collection ${collectionName} not found`, data: null };
      }

      results = await collection.find(query, options).toArray(); // Execute the MongoDB query

      return { err: null, data: results };
    } catch (err: any) {
      logger.error(`Error executing MongoDB query on collection: ${collectionName}`, {
        error: err,
        query,
        options,
      });

      return { err: err, data: null };
    }
  }

  // Insert documents into a MongoDB collection
  async insertDocuments(collectionName: string, documents: any[]) {
    logger.debug("MongoDB:Insert", collectionName, documents);

    if (!documents || documents.length === 0) {
      return { err: "No Documents to Insert", data: null };
    }

    try {
      await this.isConnected();
      const collection = this.db?.collection(collectionName);

      if (!collection) {
        return { err: `Collection ${collectionName} not found`, data: null };
      }

      const response = await collection.insertMany(documents); // Insert multiple documents

      return { err: null, data: response.ops }; // Return the inserted documents
    } catch (err: any) {
      logger.error(`Error inserting documents into MongoDB collection: ${collectionName}`, {
        error: err,
        documents,
      });

      return { err: err, data: null };
    }
  }

  // Executes an aggregation pipeline
  async execAggregation(collectionName: string, pipeline: any[]) {
    logger.debug("MongoDB:Aggregation", collectionName, pipeline);

    if (!pipeline || pipeline.length === 0) {
      return { err: "No Pipeline Provided", data: null };
    }

    let results = [];
    try {
      await this.isConnected();
      const collection = this.db?.collection(collectionName);

      if (!collection) {
        return { err: `Collection ${collectionName} not found`, data: null };
      }

      results = await collection.aggregate(pipeline).toArray(); // Execute the aggregation pipeline

      return { err: null, data: results };
    } catch (err: any) {
      logger.error(`Error executing aggregation on MongoDB collection: ${collectionName}`, {
        error: err,
        pipeline,
      });

      return { err: err, data: null };
    }
  }

  // Extracts parameters from a content object for MongoDB queries
  async extractParameters(content: any) {
    const parameters: any = {};
    for (const key in content) {
      if (content.hasOwnProperty(key)) {
        parameters[key] = content[key];
      }
    }
    return parameters;
  }

  // Execute a query and format the result
  async formattedQuery(collectionName: string, query: any, format: any) {
    const results = await this.execQuery(collectionName, query);
    return format(results);
  }

  // Execute an aggregation and format the result
  async formattedAggregation(collectionName: string, pipeline: any[], format: any) {
    const results = await this.execAggregation(collectionName, pipeline);
    return format(results);
  }

  // Determines the MongoDB field type for a given value (optional)
  async getVarType(value: any) {
    if (typeof value === "number") {
      return Number.isInteger(value) ? "int" : "double";
    } else if (typeof value === "string") {
      return "string";
    } else if (typeof value === "boolean") {
      return "bool";
    } else if (value instanceof Date) {
      return "date";
    } else if (value instanceof Array) {
      return "array";
    } else if (value === null) {
      return "null";
    } else {
      return "object"; // Fallback to "object" for unsupported types
    }
  }
}
