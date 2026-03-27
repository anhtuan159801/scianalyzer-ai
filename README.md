# SciAnalyzer AI

Ứng dụng phân tích tài liệu nghiên cứu khoa học bằng PDF, gồm upload tài liệu, tóm tắt, chat grounded theo nội dung tài liệu, và một số công cụ hỗ trợ viết học thuật.

LLM được fallback theo thứ tự:
`Groq -> OpenRouter -> Hugging Face -> Gemini`

## Yêu cầu

- Node.js 20+
- Ít nhất một API key LLM

## Chạy local

1. Cài dependencies:
   `npm install`
2. Tạo file `.env` hoặc `.env.local` từ `.env.example`
3. Chạy dev server:
   `npm run dev`
4. Mở:
   `http://localhost:3000`

## Deploy lên Render

Repo đã có sẵn [render.yaml](c:\AnhTuan\Anh_Tuan\Tool\scianalyzer-ai\render.yaml) cho dạng Node Web Service.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Port: dùng biến môi trường `PORT` do Render cấp

Trên Render, chỉ cần khai báo các biến môi trường cần thiết như:
- `APP_URL`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- `HUGGINGFACE_API_KEY`
- `GEMINI_API_KEY`

## Chạy bằng Docker

Build image:
`docker build -t scianalyzer-ai .`

Run container:
`docker run --rm -p 3000:3000 --env-file .env scianalyzer-ai`

## Kiểm tra nhanh

- `npm run lint`
- `npm run build`
- `GET /api/health`

## Kiến trúc ngắn gọn

- `server.ts`: Express server + upload PDF + parse PDF + Vite middleware
- `src/App.tsx`: điều phối trạng thái chính và layout
- `src/services/llmService.ts`: client gọi backend LLM gateway
- `src/components/*`: upload, summary, chat, tool actions

## Ghi chú

- Script `clean` đã tương thích Windows.
- Fallback LLM được xử lý trong backend qua `/api/llm/generate`.
- PDF upload đang dùng `pdf-parse@1.1.1` để ổn định trên môi trường server như Render.
- Repo này có thêm `SKILL.md` để AI agent hiểu đúng luồng sửa code trong dự án.
