import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5500";
  const headers = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };

  try {
    // Lấy userId được Cognito tự động phân tích và gán vào requestContext
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: "Không tìm thấy thông tin tài khoản.",
        }),
      };
    }

    // Truy vấn dựa trên Global Secondary Index (GSI) để tránh scan toàn bộ bảng
    const params = {
      TableName: process.env.TABLE_NAME || "TasksTable",
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
    };

    const data = await docClient.send(new QueryCommand(params));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    console.error("Lỗi khi truy vấn công việc:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Lỗi Hệ Thống Internal Server",
        error: error.message,
      }),
    };
  }
};
