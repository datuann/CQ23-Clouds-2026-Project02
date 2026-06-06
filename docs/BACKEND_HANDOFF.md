# Backend Handoff - Gia Tuấn

Các thông tin frontend/Cognito/CloudFront để backend cấu hình API Gateway Authorizer và CORS.

## Frontend URL

```text
CloudFront URL = https://d2atra32tlg2yg.cloudfront.net
```

Backend nên cấu hình CORS chỉ cho origin này:

```text
Access-Control-Allow-Origin = https://d2atra32tlg2yg.cloudfront.net
```

Không dùng `*` khi triển khai thật.

## Cognito

```text
Region = ap-southeast-1
User Pool ID = ap-southeast-1_kG2xh3fUP
App Client ID = 444s4t2ma8qendcc0ool3fp9p7
Cognito Domain = https://ap-southeast-1kg2xh3fup.auth.ap-southeast-1.amazoncognito.com
OAuth grant = Authorization code grant + PKCE
Scopes = openid, email, profile
```

API Gateway cần Cognito Authorizer gắn với User Pool trên. Frontend sẽ gửi JWT trong header:

```text
Authorization: <id_token>
```

## Frontend cần nhận từ backend

```text
API Invoke URL = https://nbht4903s6.execute-api.ap-southeast-1.amazonaws.com/prod
TABLE_NAME = TasksTable
Endpoints = GET /tasks, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id}
```

Sau khi nhận API Invoke URL, cập nhật `frontend/app.js`:

```javascript
apiBaseUrl: "https://nbht4903s6.execute-api.ap-southeast-1.amazonaws.com/prod",
useMockData: false
```

Lưu ý: frontend không tự gửi `userId`. Backend phải lấy `userId` từ Cognito claims.
