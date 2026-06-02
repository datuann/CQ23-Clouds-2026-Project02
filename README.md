# 23120391_23120393_23120395 - Cloud Project 2

Ứng dụng web serverless Task Manager cho môn Nhập môn Điện toán đám mây.

## Cấu trúc nộp bài

```text
23120391_23120393_23120395/
├── 23120391_23120393_23120395.pdf
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
├── docs/
├── screenshots/
└── Demo.txt
```

## Chạy frontend local

Mở `frontend/index.html` trực tiếp trên trình duyệt, hoặc chạy server tĩnh:

```bash
cd frontend
python3 -m http.server 5500
```

Sau đó mở `http://localhost:5500`.

Mặc định `frontend/app.js` đang dùng `CONFIG.useMockData = true` để test CRUD và filter trước khi có AWS.
Khi nhóm đã deploy Cognito và API Gateway, cập nhật các trường trong `CONFIG`, đặt `useMockData = false`.
Luồng đăng nhập Cognito dùng Authorization code grant với PKCE, nên App Client không được bật client secret.

## Triển khai tuần 2

Xem hướng dẫn chi tiết tại `docs/WEEK2_AWS_DEPLOYMENT.md`.

## Thông tin Gia Tuấn cần nhận

- Region thống nhất của nhóm.
- API Invoke URL: `https://<api-id>.execute-api.<region>.amazonaws.com/prod`.
- Endpoint backend: `GET /tasks`, `POST /tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`.
- CloudFront domain để cấu hình callback/sign-out URL Cognito và CORS backend.

## Thông tin gửi backend

Xem `docs/BACKEND_HANDOFF.md`.

## Bằng chứng Gia Tuấn phụ trách

- `SE-1`: S3 Block Public Access bật đủ bốn tùy chọn.
- `SE-2`: S3 URL trực tiếp trả `403 Forbidden` hoặc `AccessDenied`.
- `SE-3`: CloudFront URL trả `200 OK` và web chạy được.
- `SE-4`: CloudFront origin dùng OAC.
- `CO-1`: Cognito User Pool đã tạo.
- `FE-1`: Login thành công.
- `FE-2`: Tạo, sửa, xóa task thành công.
- `FE-3`: Lọc task theo priority và dueDate.
