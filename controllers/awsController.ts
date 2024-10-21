import AWSService from "../services/AWSClass"

const aws = new AWSService("smartweb-pro.com")

export const getBuckets = async () => {
    return await aws.getBuckets()
}

export const getFiles = async (params: any) => {
    return await aws.listFiles(params)
}

export const downloadFile = async (params: any) => {
    return await aws.downloadFile(params)
}