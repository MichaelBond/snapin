import logger from '../utils/logger'
import ChatGPTServiceClass from "../services/ChatGPTClass";

const chatGPT = new ChatGPTServiceClass()

export const askQuestion = async () => {
    const response = await chatGPT.chat({
        model: ChatGPTServiceClass.prototype.defaultModel,
        messages: [
            { role: 'user', content: 'Say this is a test' }
        ]
    })
    return response
}