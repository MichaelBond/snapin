import config from '../configs/config'
import logger from "../utils/logger"
import axios from "axios"
import { Pinecone } from "@pinecone-database/pinecone";

export default class PineconeService {
    chatApiKey: string
    pinecone: Pinecone
    environment: string
    indexName: string
    pineconeKey: string
    pathName: string
    defaultModel: string
    chatModels: string[]

    constructor() {
        this.chatApiKey = `Bearer ${config.CHATGPT_SECRET_TOKEN}`
        this.environment = config.PINECONE.environment
        this.indexName = config.PINECONE.indexName
        this.pineconeKey = config.PINECONE.apiKey
        this.pathName = config.PINECONE.pathName
        this.defaultModel = "gpt-4o-mini"
        this.chatModels = ["gpt-3.5-turbo-16k-0613", "gpt-4-turbo", "gpt-4o-mini"]
      
        this.pinecone = new Pinecone({
            apiKey: this.pineconeKey
        });        
    }

    async query(
        queryVector: number[],
        topK: number,
        environ?: string,
        indexID?: string,
        key?: string
      ) {
        try {
          environ = environ ? environ : this.environment;
          indexID = indexID ? indexID : this.indexName;
          key = key ? key : this.pineconeKey;
    
          const index = this.pinecone.index(indexID);
          logger.info(environ, indexID, key);
          const response = await index.query({
            topK: topK,
            vector: queryVector,
            includeMetadata: true,
            includeValues: true,
          });
          logger.info("Query results:", response);
          return { err: null, data: response };
        } catch (error) {
          return { err: error, data: null };
        }
    }
      
    async upsert(vectors, environ, indexID, key) {
        try {
          environ = environ ? environ : this.environment;
          indexID = indexID ? indexID : this.indexName;
          key = key ? key : this.pineconeKey;
          const index = this.pinecone.index(indexID);
          const response = await index.upsert(vectors);
          logger.info("Upload successful:", response);
          return { err: null, data: response };
        } catch (error) {
          return { err: error, data: null };
        }
    }

    async fetch(ids, environ, indexID, key) {
        try {
          environ = environ ? environ : this.environment;
          indexID = indexID ? indexID : this.indexName;
          key = key ? key : this.pineconeKey;
          const index = this.pinecone.index(indexID);
          const response = await index.fetch(ids);
          logger.info("Upload successful:", response);
          return { err: null, data: response };
        } catch (error) {
          return { err: error, data: null };
        }
    }

    async serverlessCreateIndex( dimensions, indexID, key, metric, cloud, region ) {
        indexID = indexID ? indexID : this.indexName
        key = key ? key : this.pineconeKey
        dimensions = dimensions ? dimensions : 1536
        metric = metric ? metric : "cosine"
        cloud = cloud ? cloud : "aws"         
        region = region ? region : "us-east-1"
        try {
            const response = await this.pinecone.createIndex({
                name: indexID,
                dimension: dimensions,
                metric: metric,
                spec: { 
                    serverless: { 
                        cloud: cloud, 
                        region: region 
                    }
                } 
            }); 
            logger.info("Index created:", response);
            return { err: null, data: response };
        }
        catch(err) {
            logger.error("Index failed to create:", err);
            return { err: err, data: 'Index failed' };            
        }
    }    
}


/*
const SDK = {
  defaultModel: "gpt-4o-mini",
  chatModels: ["gpt-3.5-turbo-16k-0613", "gpt-4-turbo", "gpt-4o-mini"],
  PineCone: {
    createIndex: function( params ) {
      const indexID = params.indexName;
      const dimension = dimension || 1536;
      const metaConfig = params.indexes ? params.indexes : [];
      const specType = params.serverless ? "serverless" : "pods";
      if ( specType === "serverless" ) {
        const serverless = params.serverless ? params.serverless :{
          cloud: 'aws',
          region: 'us-west-2',
        };
      }
      else {
        const pod = params.pods ? params.pods : {
          environment: environment,
          pods: 2,
          podType: 'p1.x2',
        };
        if ( metaConfig.length > 0 ) {
          pod["metadataConfig"] = metaConfig;
        }
      }
      const spec = specType === "serverless" ? {serverless: serverless} :  { pod: pod};
      try {
        const config = {
          name: indexID,             //'sample-index',
          dimension: dimension,   // 1536,
          spec: spec
        }
        pinecone.createIndex(config);
        return( { err: null, data: config} );
      }
      catch( err ) {
          console.log("Error Creating Index",config)
          return( { err: err, data: config });
      }
    },
    describeIndex: async function( params ) {
      
      
        // returns object
        // {
        //     name: 'serverless-index',
        //     dimension: 1536,
        //     metric: 'cosine',
        //     host: 'serverless-index-4zo0ijk.svc.us-west2-aws.pinecone.io',
        //     deletionProtection: 'disabled',
        //     spec: {
        //       serverless: {
        //           cloud: 'aws',
        //           region: 'us-west-2'
        //       }
        //     },
        //     status: {
        //       ready: false,
        //       state: 'Initializing'
        //     }
        // }
          
      try {
        const indexID = params.indexName ? params.indexName : indexName;
        const response = await pinecone.describeIndex(indexID);
        return( { err: null, data: response });
      }
      catch( err ) {
        console.log("Error Describing Index", indexID)
        return( { err: err, data: params });
      }
    },
    deleteIndex: async function( params ) {
      try {
        const indexID = params.indexName ? params.indexName : indexName;
        const response = await pinecone.deleteIndex(indexID);
        return( { err: null, data: response });
      }
      catch( err ) {
        console.log("Error Deleting Index", indexID)
        return( { err: err, data: params });
      }
    },
    deleteAll: async function( params ) {
      const indexID = params.indexName ? params.indexName : indexName;
      const namespace = params.namespace ? params.namespace : "";
      const index = pinecone.index(indexID);
      try {
        const response = await index.namespace(namespace).deleteAll();
      }
      catch( err ) {
        console.log("Error Deleting All Vectors", indexID)
        return( { err: err, data: params });
      }      
    },
    listIndexes: async function() {
      //  returns 
      //     indexes: [
      //         {
      //           name: 'serverless-index',
      //           dimension: 1536,
      //           metric: 'cosine',
      //           host: 'serverless-index-4zo0ijk.svc.us-west2-aws.pinecone.io',
      //           deletionProtection: 'disabled',
      //           spec: {
      //             serverless: {
      //             cloud: 'aws',
      //                 region: 'us-west-2',
      //               },
      //             },
      //             status: {
      //               ready: true,
      //               state: 'Ready',
      //             },
      //         }
      //     ],      
      // 
      try {
        const response = await pinecone.listIndexes();
        return( { err: null, data: response });
      }
      catch( err ) {
        console.log("Error Deleting Index", indexID)
        return( { err: err, data: indexID });
      }
    },
    indexStats: async function( params ) {
      //  returns stats{
      //        namespaces: {
      //         '': { recordCount: 10 }
      //         foo: { recordCount: 2000 },
      //         bar: { recordCount: 2000 }
      //       },
      //       dimension: 1536,
      //       indexFullness: 0,
      //       totalRecordCount: 4010
      //   }
      // 
      try {
        const indexID = params.indexName ? params.indexName : indexName;
        const index = await pinecone.index( indexID )
        const response = await index.describeIndexStats();
        return( { err: null, data: response });
      }
      catch( err ) {
        console.log("Error Getting Index Status", indexID)
        return( { err: err, data: response });
      }      
    },
    upsert: async function( params ) {
      const indexId = params.indexID || indexName;
      const vectors = params.vectors;
      const metadata = params.metadata;

      const index = pinecone.index(indexId);
      const response = await index.upsert([{
            id: params.id,
            values: vectors,
            metadata: metadata,
      }]);
    },
    query: async function( params ) {
      //  returns {
      //    matches: [
      //     {
      //       id: '556',
      //       score: 1.00000012,
      //       values: [],
      //       sparseValues: undefined,
      //       metadata: undefined
      //     },
      // 
      try {
        const indexId = params.indexID || indexName;
        const topK = params.topK ? params.topK : this.topK;
        const vector = params.vector;
        const index = pinecone.index(indexId);
        const response = await index.query({ topK: topK, vector: vector });
        console.log("Upload successful:", response);
        return { err: null, data: response };
      } catch (error) {
        return { err: error, data: null };
      }
    }
  },
  PineconeQuery: async function (
    res,
    queryVector,
    topK,
    environ,
    indexID,
    key
  ) {
    try {
      environ = environ ? environ : process.env.PINECONE_ENVIRONMENT;
      indexID = indexID ? indexID : process.env.PINECONE_INDEX;
      key = key ? key : PineconeKey;

      const index = pinecone.index(indexID);
      console.log(environment, indexID, key);
      const response = await index.query({
        topK: topK,
        vector: queryVector,
        includeMetadata: true,
        includeValues: true,
      });
      console.log("Query results:", response);
      return { err: null, data: response };
    } catch (error) {
      return { err: error, data: null };
    }
  },
  //queryVectorDatabase(queryVector, topK).catch(console.error);
  PineconeUpsert: async function (res, vectors, environ, indexID, key) {
    try {
      environ = environ ? environ : environment;
      indexID = indexID ? indexID : indexName;
      key = key ? key : PineconeKey;
      const index = pinecone.index(indexID);
      const response = await index.upsert(vectors);
      console.log("Upload successful:", response);
      return { err: null, data: response };
    } catch (error) {
      return { err: error, data: null };
    }
  },
  PineconeFetch: async function (res, ids, environ, indexID, key) {
    try {
      environ = environ ? environ : environment;
      indexID = indexID ? indexID : indexName;
      key = key ? key : PineconeKey;
      // pinecone.configuration.apiKey = key;
      // pinecone.configuration.environment = environ;
      const index = pinecone.index(indexID);
      const response = await index.fetch(ids);
      console.log("Upload successful:", response.data);
      return { err: null, data: response.data };
    } catch (error) {
      return { err: error, data: null };
    }
  },
  PineconeServerlessIndexCreate: async function (dimensions, indexID, key) {
    indexID = indexID ? indexID : indexName;
    key = key ? key : PineconeKey;
    const dim = dimensions ? dimensions : 1536;
    axios
      .post(
        "https://api.pinecone.io/indexes",
        {
          name: indexID,
          dimension: dim,
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-west-2",
            },
          },
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Api-Key": key,
          },
        }
      )
      .then((response) => {
        console.log("Index created:", response.data);
        return { err: null, data: response.data };
      })
      .catch((error) => {
        console.error("Error creating index:", error);
        return { err: error, data: null };
      });
  },
  PineconeIndexServerLessFetch: async function (indexID, key) {
    indexID = indexID ? indexID : indexName;
    key = key ? key : PineconeKey;
    axios
      .get(`https://api.pinecone.io/indexes/${indexID}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": key,
        },
      })
      .then((response) => {
        console.log("Response:", response.data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  },

  scrapeWebPage: async function (res, url) {
    axios
      .get(url)
      .then((response) => {
        // Check if the request was successful
        if (response.status === 200) {
          console.log("Status Code:", response.status);
          console.log("Status Text:", response.statusText);
          console.log("Response Headers:", response.headers);

          // Access response data (assuming it's JSON)
          console.log("Response Data:", response.data);
          res.status(200).json({ err: null, data: response.data });
        } else {
          console.error("Failed to retrieve the web page");
          res
            .status(501)
            .json({ err: "Failed to retrieve the web page", data: null });
        }
      })
      .catch((error) => {
        res.status(502).json({ err: error, data: null });
      });
  },
  chatGPTChat: async function (res, conversation, API_KEY) {
    try {
      let tools = conversation.tools ? conversation.tools : null;
      let model = conversation.model ? conversation.model : this.defaultModel;
      let content = {
        model: model,
        temperature: conversation.temperature ? conversation.temperature : 0.5,
        messages: conversation.messages,
      };
      if (tools) {
        content["tools"] = tools;
      }
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: API_KEY,
            "openai-conversation-id": conversation.conversationId,
          },
          body: content,
        }
      );

      const completion = response.data;
      console.log(completion);
      res.send(completion);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("An error occurred");
    }
  },
  chatGPTEmbeddings: async function(res, content, API_KEY) {
    const model = content.model ? content.model : "text-embedding-ada-002";
    let retries = 0;
    try {
      let contentItems = JSON.stringify(content.content);
      console.log("contentItems: ", contentItems);
      const response = await fetch(`https://api.openai.com/v1/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY,
        },
        body: JSON.stringify({
          model: model,
          input: contentItems,
          encoding_format: "float",
        }),
      });
      //console.log(response);
      if (response && response.status === 429) {
        retries++;
        const retryAfter = response.headers.get("Retry-After") || 1; // Default to 1 second if not provided
        console.log(
          `Rate limit exceeded. Retrying after ${retryAfter} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        //} else {
        //  throw new Error(`Request failed with status ${response.status}`);
      }
  
      if (response.status === 200) {
        const data = await response.json();
        res.send(data);
      } else {
        console.error("Failed to get embeddings:", response, response.status);
        res.status(500).send("An error occurred");
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("An error occurred");
    }
  },
  chatGPTask: async function(conversation) {
    try {
      let model = conversation.model ? conversation.model : this.defaultModel;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CHATGPT_REAL_TOKEN}`,
          "openai-conversation-id": conversation.conversationId,
        },
        body: JSON.stringify({
          model: model, //"gpt-4o-mini", //"gpt-3.5-turbo-16k-0613",
          messages: conversation.messages,
          max_tokens: 200,
        }),
      });
  
      const data = await response.json();
      console.log("chatGPTTask: ", data);
      return data;
    } catch (error) {
      console.error("Error:", error);
      throw error; // This will allow the outer function to catch the error
    }
  },

  chatGPTImages: async function (res, params) {
    const requestBody = params;
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY,
      },
    };
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/images/generations",
        requestBody,
        config
      );
      console.log(response.data);
      res.send(response.data);
    } catch (error) {
      console.error(error);
      res.send(error);
    }
  },
  chatGPTPlugins: async function(conversation) {
    try {
      let model = conversation.model ? conversation.model : this.defaultModel;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CHATGPT_REAL_TOKEN}`,
        },
        body: JSON.stringify({
          model: model, //"gpt-4o-mini", //"gpt-3.5-turbo-16k-0613",
          messages: conversation.messages,
          functions: conversation.functions,
          function_call: 'auto'
        }),
      });
  
      const data = await response.json();
      console.log("chatGPTPlugins: ", data);
      return data;
    } catch (error) {
      console.error("Error:", error);
      throw error; // This will allow the outer function to catch the error
    }
  },
  postQuestion: async function (res, text) {
    try {
      const requestBody = {
        prompt: text,
        model: "davinci-codex",
        max_tokens: 25,
      };

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY,
        },
      };

      const response = await axios.post(
        "https://api.openai.com/v1/engines/davinci-codex/completions",
        requestBody,
        config
      );

      const completion = response.data;
      res.send(completion);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("An error occurred");
    }
  },

  TextToSpeech: async function (res, params) {
    try {
      const API_KEY = process.env.GOOGLE_API_KEY;
      const { text, languageCode, name, audioEncoding } = params;
      const requestBody = {
        input: {
          text: text ? text : "You failed to pass any text",
        },
        voice: {
          languageCode: languageCode ? languageCode : "en-US",
          name: name ? name : "en-US-Neural2-D",
        },
        audioConfig: {
          audioEncoding: audioEncoding ? audioEncoding : "MP3",
        },
      };
      const options = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const response = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
        requestBody,
        options
      );
      res.status(201).send(response.data);
    } catch (error) {
      console.log("Error:", error);
      res.status(500).send("An error occurred");
    }
  },
  TextToSpeechVoices: async function (res) {
    try {
      const API_KEY =  process.env.GOOGLE_API_KEY;

      const options = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const response = await axios.get(
        `https://texttospeech.googleapis.com/v1/voices?key=${API_KEY}`,
        options
      );
      res.status(201).send(response.data);
    } catch (error) {
      console.log("Error:", error);
      res.status(500).send("An error occurred");
    }
  },

  flowQuery: async function (data, toolId) {
    try {
      console.log(data, toolId);
      const endpoint = `${process.env.FLOWISE_URL}:${process.env.FLOWISE_PORT}/api/v1/prediction/${toolId}`;
      console.log(endpoint, data, toolId);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLOWISE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: data }),
      });
      const result = await response.json();
      console.log(result);
      return { err: null, data: result };
    } catch (err) {
      return { err: err, data: null };
    }
  },
  
  // endatoSearch: async function ()
  
};
*/