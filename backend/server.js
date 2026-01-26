const http = require("http");
const dns = require("dns").promises;
const { Pool } = require("pg");

const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;
function parseOrigins(value) {
  if (!value) return ["*"];
  var cleaned = value.trim().replace(/^["']|["']$/g, "");
  if (!cleaned) return ["*"];
  return cleaned.split(",").map(function (item) {
    return item.trim().replace(/^["']|["']$/g, "");
  }).filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env.FRONTEND_ORIGIN);

function resolveOrigin(requestOrigin) {
  if (allowedOrigins.indexOf("*") !== -1) return "*";
  if (requestOrigin && allowedOrigins.indexOf(requestOrigin) !== -1) {
    return requestOrigin;
  }
  return allowedOrigins[0] || "*";
}

if (!dbUrl) {
  console.error("DATABASE_URL não definido.");
  process.exit(1);
}

let pool;

function sendJson(res, status, payload, requestOrigin) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": resolveOrigin(requestOrigin),
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  });
  res.end(JSON.stringify(payload));
}

function notFound(res, requestOrigin) {
  sendJson(res, 404, { error: "Not found" }, requestOrigin);
}

async function getCount(docId) {
  const result = await pool.query(
    "SELECT count FROM likes WHERE doc_id = $1",
    [docId]
  );
  return result.rows[0] ? result.rows[0].count : 0;
}

async function incrementCount(docId) {
  const result = await pool.query(
    "INSERT INTO likes (doc_id, count) VALUES ($1, 1) " +
      "ON CONFLICT (doc_id) DO UPDATE SET count = likes.count + 1, updated_at = now() " +
      "RETURNING count",
    [docId]
  );
  return result.rows[0].count;
}

async function start() {
  let resolvedHost = "";
  try {
    const host = new URL(dbUrl).hostname;
    const lookup = await dns.lookup(host, { family: 4 });
    resolvedHost = lookup.address;
  } catch (err) {
    console.warn("Falha ao resolver IPv4, usando host original:", err.message);
  }

  pool = new Pool({
    connectionString: dbUrl,
    // Render pode não ter IPv6; força IPv4 para o host do Postgres.
    host: resolvedHost || undefined,
    family: 4,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {}, req.headers.origin);
    return;
  }

  if (req.url === "/health") {
    sendJson(res, 200, { ok: true }, req.headers.origin);
    return;
  }

    const match = req.url.match(/^\/likes\/([^/?#]+)/);
  if (!match) {
    notFound(res, req.headers.origin);
    return;
  }

    const docId = decodeURIComponent(match[1]);
    try {
    if (req.method === "GET") {
      const count = await getCount(docId);
      sendJson(res, 200, { docId, count }, req.headers.origin);
      return;
    }
    if (req.method === "POST") {
      const count = await incrementCount(docId);
      sendJson(res, 200, { docId, count }, req.headers.origin);
      return;
    }
    sendJson(res, 405, { error: "Method not allowed" }, req.headers.origin);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: "Server error" }, req.headers.origin);
  }
});

  server.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
}

start();
