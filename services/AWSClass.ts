import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
//import { SecretsManagerClient, GetSecretValueCommand} from "@aws-sdk/client-secrets-manager";
import config from '../configs/config';
import logger from '../utils/logger';

export default class AWSService {
  private s3Client: S3Client;
  private bucketName: string;
  private AWS_ACCESS_KEY: string;
  private AWS_SECRET_KEY: string;
  //private secretsManagerClient: SecretsManagerClient

  constructor(bucketName: string) {
    this.bucketName = bucketName || config.AWS.BUCKET;
    this.AWS_ACCESS_KEY = config.AWS.OPTIONS.credentials.accessKeyId
    this.AWS_SECRET_KEY = config.AWS.OPTIONS.credentials.secretAccessKey
 
    this.s3Client = new S3Client( { 
      credentials: {
        accessKeyId: this.AWS_ACCESS_KEY,
        secretAccessKey: this.AWS_SECRET_KEY
      },
     // s3ForcePathStyle: true,
     // signatureVersion: "v4",
      region: "us-east-1",
    })

  }
 
  // Uploads a file to S3
  async uploadFile(key: string, body: Buffer | string, contentType: string) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      };

      logger.debug("S3: Uploading file", params);

      const result = await this.s3Client.send(new PutObjectCommand(params));
      return { err: null, data: result };
    } catch (err: any) {
      logger.error(`Error uploading file to S3: ${key}`, { error: err, key });
      return { err: err, data: null };
    }
  }

  // Downloads a file from S3
  async downloadFile( location: { bucket: string, key: string}) {
    try {
      const params = {
        Bucket: location.bucket,
        Key: location.key,
      };

      logger.debug("S3: Downloading file", params);

      const result = await this.s3Client.send(new GetObjectCommand(params));
      return { err: null, data: result.Body };  // result.Body will be a stream
    } catch (err: any) {
      logger.error(`Error downloading file from S3: ${location.key}`, { err: err, data: location.key });
      return { err: err, data: null };
    }
  }

  // Deletes a file from S3
  async deleteFile(key: string) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      logger.debug("S3: Deleting file", params);

      const result = await this.s3Client.send(new DeleteObjectCommand(params));
      return { err: null, data: result };
    } catch (err: any) {
      logger.error(`Error deleting file from S3: ${key}`, { error: err, key });
      return { err: err, data: null };
    }
  }

  // Lists files in a specific S3 bucket prefix (directory)
  async listFiles( location: { bucket: string, path: string}) {
    try {
      const params = {
        Bucket: location.bucket,
        Prefix: location.path,
      };

      logger.debug("S3: Listing files", params);

      const result = await this.s3Client.send(new ListObjectsV2Command(params));
      return { err: null, data: result.Contents };
    } catch (err: any) {
      logger.error(`Error listing files from S3: ${location.path}`, { error: err, data: location.path });
      return { err: err, data: null };
    }
  }

  // Copies a file from one location to another in the same S3 bucket
  async copyFile(sourceKey: string, destinationKey: string) {
    try {
      const params = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      };

      logger.debug("S3: Copying file", params);

      const result = await this.s3Client.send(new CopyObjectCommand(params));
      return { err: null, data: result };
    } catch (err: any) {
      logger.error(`Error copying file in S3: ${sourceKey} to ${destinationKey}`, { error: err, sourceKey, destinationKey });
      return { err: err, data: null };
    }
  }

  // Extracts S3 object metadata without downloading the file
  async getFileMetadata(key: string) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      logger.debug("S3: Getting file metadata", params);

      const result = await this.s3Client.send(new HeadObjectCommand(params));
      return { err: null, data: result };
    } catch (err: any) {
      logger.error(`Error getting file metadata from S3: ${key}`, { error: err, key });
      return { err: err, data: null };
    }
  }

  // Executes a file upload and formats the result
  async formattedUploadFile(key: string, body: Buffer | string, contentType: string, format: any) {
    const result = await this.uploadFile(key, body, contentType);
    return format(result);
  }

  // Executes a file download and formats the result
  async formattedDownloadFile(key: string, format: any) {
    const result = await this.downloadFile(key);
    return format(result);
  }

  // Executes a file listing and formats the result
  async formattedListFiles(prefix: string, format: any) {
    const result = await this.listFiles(prefix);
    return format(result);
  }

  // Executes a Bucket listing and formats the result
  async getBuckets() {
    try {
      const result = await this.s3Client.send(new ListBucketsCommand({}));
      logger.debug("S3: Listing buckets", result.Buckets);
      return { err: null, data: result.Buckets };
    } catch (err: any) {
      logger.error("Error listing S3 buckets", { error: err });
      return { err: err, data: null };
    }
  }
}
