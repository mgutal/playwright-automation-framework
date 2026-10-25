# Playwright + TypeScript Automation Framework

UI (Page Object Model) and API testing in one framework, with Excel-driven test data, a reusable HTTP client, global/per-test setup and teardown, and three report formats.

## Quick start

```bash
npm install
npm run install:browsers      # downloads Chromium
cp .env.example .env          # adjust URLs / credentials if needed
npm run data:generate         # creates test-data/testdata.xlsx and sample upload files
npm test                      # run everything
```

| Command | What it does |
|---|---|
| `npm run test:ui` / `test:api` | Run one project only |
| `npm run test:smoke` | Run tests tagged `@smoke` |
| `npm run test:headed` | UI tests in a visible browser |
| `npm run report:html` | Open the Playwright HTML report |
| `npm run report:allure` | Build and open the Allure report (needs Java) |
| `npm run typecheck` | `tsc --noEmit` |

## Structure

```
src/
  config/env.ts            # env vars + defaults (.env)
  pages/                   # Page Object Model: BasePage, LoginPage, InventoryPage
  api/PostsService.ts      # API service object (endpoints + payload types)
  utils/httpUtils.ts       # HttpUtils: GET/POST/PUT/PATCH/DELETE + content types + uploads
  utils/excelReader.ts     # Excel -> JSON objects
  utils/logger.ts
  fixtures/test-fixtures.ts# page objects, API clients, per-test cleanup
  global/                  # global-setup.ts / global-teardown.ts
tests/
  ui/                      # login (Excel-driven), inventory (reuses saved session)
  api/                     # posts (all verbs), content-types (json, form, multipart)
test-data/                 # testdata.xlsx + files/ (png, csv, pdf, xlsx) - generated
scripts/generate-test-data.ts
```

## HttpUtils

```ts
const res = await http.post<Post>('/posts', { body: { title: 'x' } });               // application/json
await http.post('/login', { form: { user: 'a', pass: 'b' } });                       // x-www-form-urlencoded
await http.upload('/files', { field: 'file', filePath: 'test-data/files/sample.pdf' },
                  { fields: { description: 'monthly report' } });                    // multipart/form-data
await http.get('/items', { params: { page: 1 }, headers: { 'X-Trace': '1' } });
await http.put(...); await http.patch(...); await http.delete(...);
```

- Every call returns `{ status, ok, headers, body, durationMs, raw }`; JSON is parsed automatically.
- `contentType` is inferred (JSON by default, multipart when `files` is given, form when `form` is given) or can be set explicitly via the `ContentType` enum.
- For multipart, `Content-Type` is deliberately left to Playwright so the boundary is set correctly. MIME types for png, jpg, gif, csv, pdf, xls(x), txt and json are detected from the file extension.
- `responseType: 'buffer' | 'text' | 'json' | 'auto'` for binary downloads.
- `setAuthToken()` or `API_TOKEN` adds a `Bearer` header.

## Excel to JSON

```ts
const rows = readExcel<LoginRow>('test-data/testdata.xlsx', 'LoginData');  // [{ username, password, ... }]
for (const row of rows) test(row.testCase, async () => { ... });            // one test per row
```

The first row is the header. `true`/`false` text becomes booleans, JSON text becomes objects, empty cells are omitted. `excelToJsonFile()` writes a sheet out as `.json`. The reader is synchronous so tests can be generated at load time.

## Setup and teardown

- **Global setup** (`global-setup.ts`): cleans old results, logs in once through the UI and saves the session to `.auth/user.json`. Set `SKIP_AUTH_SETUP=true` to skip it.
- **Global teardown** (`global-teardown.ts`): deletes the saved session.
- **Per test**: the `addCleanup(fn)` fixture runs registered functions after each test in reverse order, even when the test fails. `beforeEach`/`afterEach` hooks work as usual.

## Reporting

`list` (console), `html` (`playwright-report/`), `allure-playwright` (`allure-results/`), plus JUnit when `CI` is set. Traces, screenshots and videos are kept on failure.

## Skills

**Core stack**
- Playwright Test (TypeScript, strict mode), Node.js, npm
- Fixtures, projects, tags, parallel execution, retries, storage state

**Framework design**
- Page Object Model with a shared `BasePage` and `test.step` reporting
- API service objects, typed request/response models
- Data-driven testing from Excel (SheetJS)
- Environment config via `.env`, strict `tsconfig`

**API testing**
- GET, POST, PUT, PATCH, DELETE through one `HttpUtils` client
- `application/json`, `x-www-form-urlencoded`, `multipart/form-data` (image, Excel, CSV, PDF)
- Custom and auth headers, query params, binary responses, status and schema assertions

**UI testing**
- Resilient locators (`getByTestId`, roles), authenticated session reuse, cross-browser projects
- Cart, login and sorting flows as examples

**Quality and reporting**
- Playwright HTML, Allure and JUnit reports; trace, screenshot and video on failure
- Global and per-test setup/teardown, smoke tagging (`@smoke`, `@ui`, `@api`)

**CI/CD readiness**
- Environment-driven config, `CI` flag for retries/workers/JUnit, headless by default, ready for GitHub Actions, Jenkins or Azure DevOps

## Notes

- Sample targets are public demo services: saucedemo.com (UI), jsonplaceholder.typicode.com (JSON API, writes are faked and not persisted) and httpbin.org (echo service for headers and uploads). Point `.env` at your own system to reuse the framework.
- `xlsx@0.18.5` is used for synchronous reads; it has known issues with untrusted spreadsheets, so only load files you control.
