# Checklist Gia Tuấn

## Tuần 1 - Frontend

- [x] Tạo source `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`.
- [x] UI có Login, Sign Up, Logout.
- [x] UI có form task: `title`, `description`, `priority`, `dueDate`, `status`.
- [x] CRUD task chạy local bằng mock data.
- [x] Filter theo `priority` và `dueDate`.
- [x] Giao diện responsive trên laptop và điện thoại.

## Tuần 2 - Cognito, S3, CloudFront

- [x] Tạo Cognito User Pool `TaskManagerUserPool`.
- [x] Tạo App Client `TaskManagerWebClient`, không bật client secret.
- [x] Ghi lại Region, User Pool ID, App Client ID, Cognito Domain.
- [x] Tạo ít nhất 2 user demo hoặc tự sign up user test.
- [x] Gắn Hosted UI login/signup/logout vào frontend.
- [x] App Client bật Authorization code grant, scopes `openid`, `email`, `profile`.
- [ ] Cấu hình `apiBaseUrl` sau khi nhận từ Anh Tuấn.
- [ ] Frontend gửi JWT token trong header `Authorization`.
- [x] Tạo S3 bucket private, bật đủ 4 Block Public Access.
- [x] Upload frontend lên S3.
- [x] Tạo CloudFront distribution dùng OAC, default root object `index.html`.
- [x] Dán bucket policy do CloudFront đề xuất vào S3.

## Tuần 3 - Test và bằng chứng

- [x] Test user1 tạo/sửa/xóa task.
- [ ] Test user2 không thấy task của user1.
- [x] Test filter priority/dueDate.
- [x] Chụp `SE-1`, `SE-2`, `SE-3`, `SE-4`.
- [x] Chụp `CO-1`, `FE-1`, `FE-2`, `FE-3`.
- [ ] Gửi CloudFront domain và User Pool ID cho thành viên backend.

## Ảnh bằng chứng đã lưu

- [x] `screenshots/FE-1.png`: Login Cognito thành công.
- [x] `screenshots/SE-1.png`: S3 Block Public Access bật đủ 4 tùy chọn.
- [x] `screenshots/SE-2.png`: Truy cập S3 trực tiếp bị từ chối.
- [x] `screenshots/SE-3.png`: CloudFront URL mở web thành công / HTTP 200.
- [x] `screenshots/SE-4.png`: CloudFront origin dùng OAC.
- [x] `screenshots/CO-1.png`: Cognito User Pool đã tạo.
- [x] `screenshots/FE-2.png`: Tạo/sửa/xóa task thành công.
- [x] `screenshots/FE-3.png`: Lọc task theo priority/dueDate.

## Lưu ý bắt buộc

- Không bật S3 Static Website Hosting.
- Không tắt Block Public Access.
- Không public bucket policy.
- Không dùng S3 URL làm URL demo/nộp bài.
- Không để CORS là `*` khi triển khai thật.
- Không commit JWT token hoặc mật khẩu user demo.
