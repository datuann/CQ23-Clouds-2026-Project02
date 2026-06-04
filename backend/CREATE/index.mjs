import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

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
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Chưa xác thực người dùng" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Request body bị trống" }),
      };
    }

    // Tự động thích ứng kể cả khi API Gateway đã parse JSON hoặc chưa parse
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { title, description, priority, dueDate, status } = body;

    // Bắt buộc kiểm tra ràng buộc nghiệp vụ (Ràng buộc đồ án)
    if (!title || !priority || !dueDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Thiếu dữ liệu bắt buộc: title, priority, và dueDate.",
        }),
      };
    }

    const newTask = {
      taskId: crypto.randomUUID(), // Khởi tạo UUID duy nhất dạng String
      userId: userId, // Gán userId bảo mật từ JWT Token claims
      title,
      description: description || "",
      priority,
      dueDate,
      status: status || "pending",
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME || "TasksTable",
        Item: newTask,
      }),
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newTask),
    };
  } catch (error) {
    console.error("Lỗi khi thêm mới công việc:", error);
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
