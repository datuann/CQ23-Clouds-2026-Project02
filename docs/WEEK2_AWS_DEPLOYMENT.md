# Week 2 AWS Deployment - Gia Tuấn

Tài liệu này dùng cho phần Gia Tuấn phụ trách: Cognito, frontend config, S3 private, CloudFront OAC và bằng chứng SE/CO/FE.

## 1. Thông tin cần thống nhất trước

Điền các giá trị này trước khi deploy thật:

```text
Region = ap-southeast-1
API Invoke URL = https://nbht4903s6.execute-api.ap-southeast-1.amazonaws.com/prod
CloudFront URL = https://d2atra32tlg2yg.cloudfront.net
User Pool ID = ap-southeast-1_kG2xh3fUP
App Client ID = 444s4t2ma8qendcc0ool3fp9p7
Cognito Domain = https://ap-southeast-1kg2xh3fup.auth.ap-southeast-1.amazoncognito.com
S3 bucket = taskmanager-frontend-<nhom>
```

Gửi cho backend:

```text
User Pool ID = ...
CloudFront URL = ...
```

Nhận từ backend:

```text
API Invoke URL = https://nbht4903s6.execute-api.ap-southeast-1.amazonaws.com/prod
Endpoints = GET /tasks, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id}
```

## 2. Tạo Cognito User Pool

1. Vào AWS Console > Cognito > User pools > Create user pool.
2. Chọn sign-in bằng `Email`.
3. Đặt tên pool: `TaskManagerUserPool`.
4. Tạo app client: `TaskManagerWebClient`.
5. Không bật client secret.
6. Bật Cognito Hosted UI.
7. Tạo Cognito domain, ví dụ: `taskmanager-nhom12`.
8. Callback URL khi test local:

```text
http://localhost:5500/
```

9. Sign-out URL khi test local:

```text
http://localhost:5500/
```

10. Sau khi có CloudFront, thêm callback và sign-out URL thật:

```text
https://<distribution-id>.cloudfront.net/
```

Bằng chứng cần chụp:

- `CO-1`: trang User Pool hiển thị tên pool và Pool ID.

## 3. Tạo 2 user demo

1. Vào Cognito > User pools > `TaskManagerUserPool` > Users.
2. Tạo tối thiểu 2 user demo, ví dụ:

```text
user1@example.com
user2@example.com
```

3. Đăng nhập thử từng user qua Hosted UI.
4. Không lưu mật khẩu demo vào source code hoặc GitHub.

## 4. Cập nhật frontend config

Mở `frontend/app.js`, cập nhật:

```javascript
const CONFIG = {
  region: "ap-southeast-1",
  userPoolId: "ap-southeast-1_xxxxx",
  clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  cognitoDomain: "https://your-domain.auth.ap-southeast-1.amazoncognito.com",
  redirectUri: "https://<distribution-id>.cloudfront.net/",
  signOutUri: "https://<distribution-id>.cloudfront.net/",
  apiBaseUrl: "https://nbht4903s6.execute-api.ap-southeast-1.amazonaws.com/prod",
  useMockData: false
};
```

Khi chỉ test local Cognito trước CloudFront:

```javascript
redirectUri: "http://localhost:5500/",
signOutUri: "http://localhost:5500/",
useMockData: true
```

Khi backend API thật đã sẵn sàng, đặt `useMockData: false`.

Bản CloudFront hiện tại:

```javascript
redirectUri: "https://d2atra32tlg2yg.cloudfront.net",
signOutUri: "https://d2atra32tlg2yg.cloudfront.net"
```

App Client Cognito cần cấu hình OAuth như sau:

```text
OAuth grant type = Authorization code grant
PKCE = dùng trong frontend, không cần client secret
Scopes = openid, email, profile
Allowed callback URLs = http://localhost:5500 và http://localhost:5500/
Allowed sign-out URLs = http://localhost:5500 và http://localhost:5500/
```

## 5. Test Cognito local

Chạy frontend:

```bash
cd frontend
python3 -m http.server 5500
```

Mở:

```text
http://localhost:5500/
```

Test:

- Bấm `Login`, trình duyệt chuyển sang Cognito Hosted UI.
- Đăng nhập bằng user demo.
- Cognito redirect về local với `code`, frontend tự đổi code lấy JWT token bằng PKCE.
- Sau redirect về web, nút `Logout` hiển thị.
- Bấm `Logout`, token local bị xóa. Nếu `useMockData = false`, trình duyệt đi qua endpoint logout của Cognito.

Bằng chứng có thể chụp:

- `FE-1`: login thành công và quay về web app.

## 6. Tạo S3 bucket private

1. Vào S3 > Create bucket.
2. Bucket name ví dụ: `taskmanager-frontend-nhom12`.
3. Chọn region thống nhất của nhóm.
4. Bật đủ 4 tùy chọn Block Public Access.
5. Không bật Static Website Hosting.
6. Upload các file trong `frontend/`:

```text
index.html
styles.css
app.js
```

Bằng chứng cần chụp:

- `SE-1`: tab Permissions cho thấy 4 checkbox Block Public Access đều bật.

## 7. Tạo CloudFront Distribution + OAC

1. Vào CloudFront > Create distribution.
2. Origin domain: chọn S3 bucket vừa tạo.
3. Origin access: chọn `Origin access control settings`.
4. Tạo OAC mới, tên gợi ý: `TaskManager-OAC`.
5. Viewer protocol policy: `Redirect HTTP to HTTPS`.
6. Default root object: `index.html`.
7. Tạo distribution.
8. Copy bucket policy do CloudFront gợi ý.
9. Vào S3 bucket > Permissions > Bucket policy và dán policy đó.
10. Chờ distribution deploy xong.

Bằng chứng cần chụp:

- `SE-4`: CloudFront origin dùng OAC.

## 8. Test bảo mật S3 và CloudFront

Test S3 direct URL:

```bash
curl -i https://<bucket-name>.s3.amazonaws.com/index.html
```

Kết quả đúng:

```text
HTTP/1.1 403 Forbidden
```

hoặc body có `AccessDenied`.

Test CloudFront:

```bash
curl -i https://<distribution-id>.cloudfront.net/
```

Kết quả đúng:

```text
HTTP/2 200
```

Bằng chứng cần chụp:

- `SE-2`: S3 direct URL bị 403.
- `SE-3`: CloudFront URL trả 200 và web chạy được.

## 9. Gửi thông tin cho backend

Sau khi có CloudFront và Cognito, gửi cho Anh Tuấn:

```text
Region = ...
User Pool ID = ...
App Client ID = ...
Cognito Domain = ...
CloudFront URL = ...
```

Backend cần các giá trị này để cấu hình Cognito Authorizer và CORS chỉ cho CloudFront domain.

## 10. Không được làm

- Không bật S3 Static Website Hosting.
- Không public S3 bucket.
- Không dùng S3 direct URL làm link demo.
- Không để CORS là `*`.
- Không commit JWT token, password demo, secret, access key.
