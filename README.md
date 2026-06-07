# 23120391_23120393_23120395 - Cloud Project 2

Ứng dụng web serverless Task Manager cho môn Nhập môn Điện toán đám mây.

## Trạng thái triển khai

Project đã được triển khai trên AWS thật.

```text
Region = ap-southeast-1
Frontend CloudFront URL = https://d2atra32tlg2yg.cloudfront.net
API Gateway Invoke URL = https://nbht4903s6.execute-api.ap-southeast-1.amazonaws.com/prod
Cognito User Pool ID = ap-southeast-1_kG2xh3fUP
Cognito App Client ID = 444s4t2ma8qendcc0ool3fp9p7
Cognito Domain = https://ap-southeast-1kg2xh3fup.auth.ap-southeast-1.amazoncognito.com
DynamoDB Table = TasksTable
```

AWS Academy chỉ được dùng để tìm hiểu/nghiên cứu trước triển khai, không dùng làm môi trường nộp bài cuối.

## Cấu trúc nộp bài

File nộp cuối cùng:

```text
23120391_23120393_23120395.zip
```

Cấu trúc bên trong:

```text
23120391_23120393_23120395/
├── 23120391_23120393_23120395.pdf
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── CREATE/
│   ├── DELETE/
│   ├── GET/
│   └── UPDATE/
├── docs/
├── screenshots/
├── README.md
└── Demo.txt
```

Nếu file nộp quá lớn, đặt link Google Drive trong báo cáo và vẫn nộp file zip theo đúng yêu cầu.

## Source

### Frontend

Frontend dùng HTML/CSS/JavaScript thuần.

Chức năng:

- Login/Sign up/Logout bằng Amazon Cognito Hosted UI.
- Authorization code grant với PKCE, không dùng client secret.
- Gửi JWT token trong header `Authorization` khi gọi API.
- CRUD task qua API Gateway.
- Lọc task theo `priority` và `dueDate`.
- Responsive cơ bản.

### Backend

Backend dùng 4 Lambda function Node.js riêng:

```text
GET    /tasks      -> backend/GET/index.mjs
POST   /tasks      -> backend/CREATE/index.mjs
PUT    /tasks/{id} -> backend/UPDATE/index.mjs
DELETE /tasks/{id} -> backend/DELETE/index.mjs
```

Backend lấy `userId` từ Cognito claims, không nhận `userId` từ frontend.

## Chạy frontend local

```bash
cd frontend
python3 -m http.server 5500
```

Sau đó mở:

```text
http://localhost:5500
```

Lưu ý: bản hiện tại đã cấu hình `useMockData: false`, nên frontend sẽ gọi API Gateway thật sau khi login Cognito.

## Deploy frontend

1. Upload các file trong `frontend/` lên S3 bucket private:

```text
index.html
styles.css
app.js
```

2. Tạo CloudFront invalidation sau mỗi lần upload:

```text
/*
```

3. Truy cập frontend qua CloudFront:

```text
https://d2atra32tlg2yg.cloudfront.net
```

Không dùng S3 direct URL làm link demo/nộp bài.

## Bằng chứng

Các ảnh bằng chứng được lưu trong `screenshots/`.

Frontend/Cognito/S3/CloudFront:

```text
SE-1.png  S3 Block Public Access bật đủ 4 tùy chọn
SE-2.png  Truy cập S3 trực tiếp bị từ chối
SE-3.png  CloudFront URL mở web thành công
SE-4.png  CloudFront origin dùng OAC
CO-1.png  Cognito User Pool đã tạo
FE-1.png  Login Cognito thành công
FE-2.png  Tạo/sửa/xóa task thành công
FE-3.png  Lọc task theo priority/dueDate
```

Các bằng chứng backend/network/IAM/monitoring/cost do các thành viên phụ trách tương ứng bổ sung vào báo cáo.

## Demo

Điền link video demo backup trong:

```text
Demo.txt
```

Video nên thể hiện:

- Mở frontend qua CloudFront.
- Login bằng Cognito.
- Tạo, sửa, xóa task.
- Lọc task.
- Đăng nhập user khác và chứng minh không thấy task của user cũ.
- S3 direct URL trả 403.

## Tài liệu hỗ trợ

```text
docs/BACKEND_HANDOFF.md
docs/GIA_TUAN_CHECKLIST.md
docs/WEEK2_AWS_DEPLOYMENT.md
```

## Lưu ý bảo mật

- Không bật S3 Static Website Hosting.
- Không tắt S3 Block Public Access.
- Không public S3 bucket.
- Không để CORS là `*` khi triển khai thật.
- Không commit JWT token, password demo, secret key hoặc AWS access key.
