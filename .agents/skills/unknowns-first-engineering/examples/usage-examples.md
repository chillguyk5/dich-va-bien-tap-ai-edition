# Usage Examples

## Explain

> Giải thích luồng xác thực hiện tại từ code và call sites; không sửa file.

## Explore

> Điều tra vì sao API trả 403. Đọc repo, env handling và log trước; chưa sửa file.

## Plan

> Lập implementation plan cho trang `/docs`, nhưng phải kiểm tra router, hosting rewrite và auth boundary hiện tại.

## Implement

> Tích hợp webhook thanh toán. Làm theo milestone, giữ nguyên provider khác, thêm kiểm thử duplicate/race và không deploy.

## Review

> Review commit này, ưu tiên correctness, regression, secret exposure và test gaps. Không tự sửa.

## Verify

> Xác minh feature đã hoạt động trong runtime, gồm success, unauthorized, retry và refresh trực tiếp.

## High-risk despite one line

> Thay một dòng kiểm soát idempotency của billing retry; kiểm tra flow thanh toán xung quanh và xác minh duplicate delivery.
