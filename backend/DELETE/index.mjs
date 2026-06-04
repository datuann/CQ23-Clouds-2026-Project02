import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

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
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const taskId = event.pathParameters?.id;

    if (!userId)
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Chưa xác thực" }),
      };
    if (!taskId)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Thiếu ID công việc" }),
      };

    const tableName = process.env.TABLE_NAME || "TasksTable";

    // BẢO MẬT: Xác thực quyền sở hữu của người dùng trước khi xoá thực thể khỏi database
    const checkItem = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { taskId },
      }),
    );

    if (!checkItem.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Công việc không tồn tại" }),
      };
    }

    if (checkItem.Item.userId !== userId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          message: "Bị từ chối: Bạn không sở hữu công việc này.",
        }),
      };
    }

    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { taskId },
      }),
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Đã xoá thành công công việc ${taskId}`,
      }),
    };
  } catch (error) {
    console.error("Lỗi khi xoá công việc:", error);
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
