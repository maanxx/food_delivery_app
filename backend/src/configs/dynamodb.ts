import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || "ap-southeast-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB.DocumentClient({
    convertEmptyValues: true,
    service: new AWS.DynamoDB(),
});

export default dynamodb;
