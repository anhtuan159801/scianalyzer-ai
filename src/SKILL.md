---
name: scianalyzer-ai-frontend
description: Frontend-specific guidance for editing the src directory in SciAnalyzer AI, including layout rules, document-context behavior, and LLM API key expectations in the UI.
---

# Frontend Skill For SciAnalyzer AI

## Phạm vi

Áp dụng khi sửa các file trong `src/`.

## Nguyên tắc

- Giữ UI theo cấu trúc hiện có: sidebar trái, nội dung giữa, panel AI bên phải.
- Một số tab là tab điều hướng, không phải tool thật. Đừng render `ToolView` cho mọi `leftTab`.
- Nếu tab cần tài liệu, phải xử lý rõ trạng thái chưa chọn tài liệu.
- Không tạo state trùng chức năng giữa `App.tsx` và component con nếu không cần thiết.

## Checklist trước khi kết thúc

- Chuyển tab `Home` hoạt động đúng kể cả khi đã chọn document.
- `My Library` hiển thị upload khi chưa có file và preview khi đã có file.
- Right panel chỉ hiện khi đang ở ngữ cảnh document.
- Text tiếng Việt hiển thị bình thường.
- API keys trong modal phải khớp với thứ tự fallback `Groq -> OpenRouter -> Hugging Face -> Gemini`.
- Build không lỗi với `npm run lint` và `npm run build`.
