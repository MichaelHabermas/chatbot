# RAGatha Ch'Bot

`RAGatha Ch'Bot` is a single-file, browser-based RAG chatbot for asking questions about your own documents. Drop in PDFs, DOCX files, Markdown, or plain text, and the app chunks the content, indexes it locally in the browser, retrieves relevant excerpts, and sends those excerpts to a chat-completions-compatible API.

There is no backend and no build step. The entire app lives in [`index.html`](./index.html).

## What It Does

- Upload `PDF`, `DOCX`, `TXT`, and `MD` files from the browser
- Parse documents client-side with `pdf.js` and `mammoth`
- Chunk and index document text locally using a simple TF-IDF retrieval pipeline
- Expand queries with chat history and a HyDE-style synthetic answer prompt before retrieval
- Stream answers from a compatible API endpoint
- Show source chips for the retrieved chunks used to answer a question
- Persist documents in `IndexedDB` and chat/settings in `localStorage`

## Supported Providers

The UI defaults to the OpenAI-compatible Chat Completions API shape, so it can work with multiple providers by changing the base URL and model.

Included endpoint suggestions:

- OpenAI: `https://api.openai.com/v1`
- Groq: `https://api.groq.com/openai/v1`
- Ollama: `http://localhost:11434/v1`
- LM Studio: `http://localhost:1234/v1`
- Together AI: `https://api.together.xyz/v1`
- OpenRouter: `https://openrouter.ai/api/v1`
- Mistral AI: `https://api.mistral.ai/v1`

## Running Locally

Because this is a static app, you can either open the file directly or serve it over HTTP. Serving it locally is the safer default, especially for PDF parsing.

### Option 1: Serve with Python

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

### Option 2: Open the File Directly

Open [`index.html`](./index.html) in your browser.

Note: some PDF workflows can fail when opened via `file://`. If that happens, use a local web server instead.

## How To Use

1. Open the app in a browser.
2. Enter an API endpoint and API key, unless you are using a local provider that does not require one.
3. Choose a model from the top bar.
4. Drag documents into the sidebar or browse for files.
5. Ask questions in the chat input.

The app will retrieve relevant chunks from the uploaded corpus and send them as context with your question.

## Storage Behavior

- API key, selected model, endpoint, and chat history are stored in `localStorage`
- Uploaded documents and their chunked index are stored in `IndexedDB`
- Storage is browser-local only; there is no server-side persistence in this project

## Limitations

- Scanned or image-only PDFs are not supported unless they already contain extractable text
- Retrieval uses a lightweight TF-IDF approach, not embeddings or vector search
- API keys are stored unencrypted in the browser
- Browser storage limits apply; large document collections may hit quota limits
- Answers depend on the selected model and the quality of retrieved chunks

## Implementation Notes

The app is intentionally minimal:

- UI, parsing, retrieval, storage, and chat streaming all live in one HTML file
- External libraries are loaded from CDNs
- Responses are rendered as sanitized Markdown using `marked` and `DOMPurify`

## File Layout

```text
.
├── index.html   # Entire application
└── README.md
```
