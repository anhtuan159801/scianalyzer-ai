---
name: scianalyzer-ai
description: Guidance for working on the SciAnalyzer AI codebase, including the PDF analysis flow, UI architecture, and LLM fallback order of Groq, OpenRouter, Hugging Face, then Gemini.
---

# SciAnalyzer AI

## Mục tiêu

Repo này là ứng dụng phân tích tài liệu PDF cho nghiên cứu khoa học, gồm:

- Frontend React + Vite trong `src/`
- Dev server Express + Vite middleware trong `server.ts`
- Upload PDF và parse text qua `pdf-parse`
- Phân tích, tóm tắt, chat qua gateway LLM với fallback:
- Groq
- OpenRouter
- Hugging Face
- Gemini
- Tool phân tích có hai nhóm:
- nhóm dùng toàn bộ thư viện tài liệu
- nhóm chỉ cần text người dùng nhập

## Cách chạy

1. `npm install`
2. Tạo `.env` hoặc `.env.local` với các API key cần dùng
3. `npm run dev`
4. Kiểm tra nhanh:
- `GET /api/health`
- upload PDF qua UI
- `npm run lint`
- `npm run build`

## Luồng chính cần hiểu trước khi sửa

- `server.ts`
- nhận file từ `/api/documents/upload`
- parse PDF từ buffer trong memory
- trả về `filename`, `text`, `info`, `metadata`, `numpages`
- quản lý fallback provider theo thứ tự `Groq -> OpenRouter -> Hugging Face -> Gemini`
- `src/App.tsx`
- quản lý `documents`, `selectedDocIndex`, `leftTab`, `rightTab`
- chỉ các tab trong nhóm tool mới yêu cầu phải có document
- `src/services/llmService.ts`
- wrapper frontend gọi backend `/api/llm/generate`
- `src/components/ChatPanel.tsx`
- chat grounded theo nội dung document đã tải
- `src/lib/toolConfig.ts`
- nguồn định nghĩa chuẩn cho công cụ, quyết định công cụ nào cần thư viện tài liệu và công cụ nào là text-only

## Quy tắc khi chỉnh sửa

- Không đổi API response của `/api/documents/upload` nếu không cập nhật toàn bộ luồng UI.
- Không tự nâng `pdf-parse` lên 2.x nếu chưa kiểm chứng lại trên môi trường deploy. Bản 2.x đã gây lỗi worker serialization trên Render; hiện repo dùng bản 1.1.1 để ổn định upload PDF.
- Không phá vỡ thứ tự fallback provider trừ khi user yêu cầu rõ.
- Nếu đổi model mặc định của provider, phải cập nhật `.env.example` và README.
- Mọi thay đổi phải chạy lại:
- `npm run lint`
- `npm run build`
- Khi thêm tool mới:
 - thêm tool vào `src/lib/toolConfig.ts`
 - đảm bảo `ToolView` có prompt và hành vi đúng cho tool đó
 - nếu tool cần corpus nhiều tài liệu, đừng ràng buộc nó vào một `selectedDocIndex`

## Các lỗi dễ tái phát

- Chọn tab `Home` nhưng vẫn bị giữ view document cũ.
- Tool id từ dashboard không được khai báo trong `LeftTab`.
- Script dùng lệnh Unix như `rm -rf` làm hỏng môi trường Windows.
- API key trong UI không đồng bộ với gateway backend.
- Text tiếng Việt bị hỏng encoding khi copy từ nguồn khác.

## Mục tiêu khi agent hỗ trợ repo này

- Ưu tiên sửa lỗi hoạt động thực tế trước cải tiến giao diện.
- Không thêm abstraction lớn nếu repo vẫn là single-app nhỏ.
- Nếu thay parser PDF hoặc model AI, phải nêu rõ rủi ro tương thích.
