const PIXIV_ORIGIN = "https://www.pixiv.net";
const PIXIV_VERSION = "e1ad262ad36ee722242e71f1b5c2dd0aa07df0f5";
const SEARCH_WORD = process.env.PIXIV_TEST_WORD || "初音ミク";
const SERIES_ID = process.env.PIXIV_TEST_SERIES_ID || "219205";

type JsonRecord = Record<string, unknown>;

interface AjaxResponse {
  error: boolean;
  message?: string;
  body: unknown;
}

interface TestContext {
  artworkId?: string;
  artworkUserId?: string;
  novelId?: string;
  novelUserId?: string;
}

interface AjaxTest {
  name: string;
  path: (context: TestContext) => string | null;
  validate: (body: unknown, context: TestContext) => void;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function asRecord(value: unknown, label: string): JsonRecord {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), `${label} must be an object`);
  return value as JsonRecord;
}

function asArray(value: unknown, label: string): unknown[] {
  assert(Array.isArray(value), `${label} must be an array`);
  return value;
}

function asString(value: unknown, label: string): string {
  assert(typeof value === "string" && value.length > 0, `${label} must be a non-empty string`);
  return value;
}

function validateWorkBucket(body: unknown, bucketName: string, context: TestContext, kind: "artwork" | "novel") {
  const root = asRecord(body, "body");
  const bucket = asRecord(root[bucketName], `body.${bucketName}`);
  const data = asArray(bucket.data, `body.${bucketName}.data`);
  assert(typeof bucket.total === "number", `body.${bucketName}.total must be a number`);
  assert(typeof bucket.lastPage === "number", `body.${bucketName}.lastPage must be a number`);
  assert(data.length > 0, `body.${bucketName}.data must not be empty`);

  const first = asRecord(data[0], `body.${bucketName}.data[0]`);
  if (kind === "artwork") {
    context.artworkId ??= asString(first.id, "artwork.id");
    context.artworkUserId ??= asString(first.userId, "artwork.userId");
    assert(typeof first.pageCount === "number", "artwork.pageCount must be a number");
    assert(typeof first.url === "string", "artwork.url must be a string");
  } else {
    context.novelId ??= asString(first.id, "novel.id");
    context.novelUserId ??= asString(first.userId, "novel.userId");
    assert(typeof first.wordCount === "number", "novel.wordCount must be a number");
    assert(typeof first.readingTime === "number", "novel.readingTime must be a number");
  }
}

function withCommonQuery(path: string): string {
  const url = new URL(path, PIXIV_ORIGIN);
  url.searchParams.set("lang", "ja");
  url.searchParams.set("version", PIXIV_VERSION);
  return `${url.pathname}${url.search}`;
}

function requestHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    accept: "application/json",
    "accept-language": "ja,en-US;q=0.9,en;q=0.8",
    referer: `${PIXIV_ORIGIN}/`,
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
  };
  const session = process.env.PIXIV_PHPSESSID;
  const userId = process.env.PIXIV_USER_ID;
  if (session) headers.cookie = `PHPSESSID=${session}`;
  if (userId) headers["x-user-id"] = userId;
  return headers;
}

async function fetchAjax(path: string): Promise<AjaxResponse> {
  const response = await fetch(`${PIXIV_ORIGIN}${withCommonQuery(path)}`, { headers: requestHeaders() });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const json = await response.json() as AjaxResponse;
  assert(typeof json.error === "boolean", "response.error must be a boolean");
  assert(json.error === false, `pixiv error response: ${json.message || "unknown error"}`);
  return json;
}

const encodedWord = encodeURIComponent(SEARCH_WORD);
const tests: AjaxTest[] = [
  {
    name: "search illustrations",
    path: () => `/ajax/search/illustrations/${encodedWord}?order=date_d&mode=all&p=1&ai_type=0&csw=0&s_mode=s_tag_full&ratio=&type=illust_and_ugoira`,
    validate: (body, context) => validateWorkBucket(body, "illust", context, "artwork")
  },
  {
    name: "search manga",
    path: () => `/ajax/search/manga/${encodedWord}?order=date_d&mode=all&p=1&ai_type=0&csw=0&s_mode=s_tag_full&ratio=`,
    validate: (body, context) => validateWorkBucket(body, "manga", context, "artwork")
  },
  {
    name: "search novels",
    path: () => `/ajax/search/novels/${encodedWord}?order=date_d&mode=all&p=1&ai_type=0&csw=0&gs=0&s_mode=s_tag_full`,
    validate: (body, context) => validateWorkBucket(body, "novel", context, "novel")
  },
  {
    name: "illustration detail",
    path: ({ artworkId }) => artworkId ? `/ajax/illust/${artworkId}` : null,
    validate: (body) => {
      const detail = asRecord(body, "body");
      asString(detail.id, "body.id"); asString(detail.title, "body.title"); asString(detail.userId, "body.userId");
      asRecord(detail.urls, "body.urls"); asRecord(detail.tags, "body.tags");
    }
  },
  {
    name: "illustration pages",
    path: ({ artworkId }) => artworkId ? `/ajax/illust/${artworkId}/pages` : null,
    validate: (body) => {
      const pages = asArray(body, "body"); assert(pages.length > 0, "body pages must not be empty");
      const page = asRecord(pages[0], "body[0]"); asRecord(page.urls, "body[0].urls");
    }
  },
  {
    name: "illustration recommendations",
    path: ({ artworkId }) => artworkId ? `/ajax/illust/${artworkId}/recommend/init?limit=18` : null,
    validate: (body) => { const root = asRecord(body, "body"); assert(Array.isArray(root.illusts), "body.illusts must be an array"); }
  },
  {
    name: "novel detail",
    path: ({ novelId }) => novelId ? `/ajax/novel/${novelId}` : null,
    validate: (body) => {
      const detail = asRecord(body, "body");
      asString(detail.id, "body.id"); asString(detail.title, "body.title"); asString(detail.userId, "body.userId");
      assert(typeof detail.content === "string", "body.content must be a string");
    }
  },
  {
    name: "user profile",
    path: ({ artworkUserId }) => artworkUserId ? `/ajax/user/${artworkUserId}?full=1` : null,
    validate: (body) => { const user = asRecord(body, "body"); asString(user.userId, "body.userId"); asString(user.name, "body.name"); }
  },
  {
    name: "user profile top",
    path: ({ artworkUserId }) => artworkUserId ? `/ajax/user/${artworkUserId}/profile/top?sensitiveFilterMode=userSetting` : null,
    validate: (body) => { const profile = asRecord(body, "body"); assert("illusts" in profile, "body.illusts is required"); assert("novels" in profile, "body.novels is required"); }
  },
  {
    name: "user profile all",
    path: ({ artworkUserId }) => artworkUserId ? `/ajax/user/${artworkUserId}/profile/all?sensitiveFilterMode=userSetting` : null,
    validate: (body) => { const profile = asRecord(body, "body"); assert("illusts" in profile, "body.illusts is required"); assert("mangaSeries" in profile, "body.mangaSeries is required"); }
  },
  {
    name: "illustration series",
    path: () => `/ajax/series/${SERIES_ID}?p=1`,
    validate: (body) => {
      const root = asRecord(body, "body");
      const thumbnails = asRecord(root.thumbnails, "body.thumbnails");
      asArray(thumbnails.illust, "body.thumbnails.illust");
      const page = asRecord(root.page, "body.page");
      asArray(page.series, "body.page.series");
      asArray(root.illustSeries, "body.illustSeries");
    }
  }
];

const context: TestContext = {};
let failures = 0;

console.log(`pixiv Ajax contract tests (${process.env.PIXIV_PHPSESSID ? "authenticated" : "public"})`);
for (const test of tests) {
  const path = test.path(context);
  if (!path) {
    failures += 1;
    console.error(`FAIL ${test.name}: prerequisite ID was not available`);
    continue;
  }
  try {
    const response = await fetchAjax(path);
    test.validate(response.body, context);
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${test.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`${tests.length - failures}/${tests.length} passed`);
if (failures > 0) process.exitCode = 1;
