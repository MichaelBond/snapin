
import axios from "axios"
import config from '../configs/config'
import logger from "../utils/logger"
import OpenAI from "openai";

// https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses
interface conversationInterface {
    tools?: 
}
export default class ChatGPTServiceClass {
    apiKey: string
    organizationId: string
    projectId: string
    defaultModel: string
    chatModels: string[]
    contentType: string
    rootUrl: string
    openAi: OpenAI

    constructor( projectId?: string) {
        this.contentType = "application/json"
        this.rootUrl = "https://api.openai.com/v1"
        this.defaultModel = "gpt-4o-mini"
        this.chatModels = ["gpt-3.5-turbo-16k-0613", "gpt-4-turbo", "gpt-4o-mini"]
        this.apiKey = config.CHATGPT.apiKey
        this.organizationId = config.CHATGPT.organizationId
        this.projectId = projectId ? projectId : config.CHATGPT.projectId
        this.openAi = new OpenAI({
            apiKey: this.apiKey,
            organization: this.organizationId,
            project: this.projectId
        })
    }
    async chat(conversation: any, API_KEY?: string) {
        try {
            let tools = conversation.tools ? conversation.tools : null;
            let model = conversation.model ? conversation.model : this.defaultModel;
            let content:  OpenAI.Chat.ChatCompletionCreateParams = {
                model: model,
                messages: conversation.messages,
                temperature: 0.7
            };
            if (tools) {
                content["tools"] = tools;
            }
            console.log( content, this.openAi)
            const response: OpenAI.ChatCompletion = await this.openAi.chat.completions.create(content);
            const completion = response;
            logger.info(completion);
            return { err: null, data: completion}
        } catch (error) {
            logger.error("Error:", error);
            return { err: error, data: "An error occurred"};
        }
    }
}
/*
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
  }
*/