import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
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
        body: JSON.stringify({ message: "Thiếu ID công việc trên đường dẫn" }),
      };

    const tableName = process.env.TABLE_NAME || "TasksTable";

    // BẢO MẬT: Kiểm tra xem Task này có thực sự thuộc về người dùng đang thực hiện không
    const existingTask = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { taskId },
      }),
    );

    if (!existingTask.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Công việc không tồn tại" }),
      };
    }

    if (existingTask.Item.userId !== userId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          message: "Bị từ chối: Bạn không có quyền chỉnh sửa công việc này.",
        }),
      };
    }

    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { title, description, priority, dueDate, status } = body;

    // Xây dựng Expression cập nhật thuộc tính động
    let updateExpression = "set";
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};

    const fieldsToUpdate = { title, description, priority, dueDate, status };

    Object.entries(fieldsToUpdate).forEach(([key, val]) => {
      if (val !== undefined) {
        updateExpression += ` #${key} = :${key},`;
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = val;
      }
    });

    updateExpression = updateExpression.slice(0, -1); // Xóa dấu phẩy cuối cùng

    if (Object.keys(expressionAttributeValues).length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Không có thuộc tính nào được cung cấp để cập nhật",
        }),
      };
    }

    const updateParams = {
      TableName: tableName,
      Key: { taskId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };

    const updatedResult = await docClient.send(new UpdateCommand(updateParams));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedResult.Attributes),
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật công việc:", error);
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
