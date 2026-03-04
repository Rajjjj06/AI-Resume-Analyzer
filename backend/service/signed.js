import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "../config/s3.js";

const getMimeType = (s3Key) => {
  const ext = s3Key.split(".").pop().toLowerCase();
  const mimeTypes = {
    pdf: "application/pdf",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

export const getPresignedUrl = async (s3Key, expiresIn = 3600) => {
  const mimeType = getMimeType(s3Key);
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ResponseContentDisposition: "inline",
    ResponseContentType: mimeType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const deleteFromS3 = async (s3Key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });
  return await s3Client.send(command);
};
