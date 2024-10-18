import S3Service from "../services/S3Class"

const s3 = new S3Service()

export const getBuckets = async () => {
    return await s3.getAllBuckets()
}