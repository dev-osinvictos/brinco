const http = require("http");
const { Pool } = require("pg");

const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";

if (!dbUrl) {
  console.error("DATABASE_URL não definido.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": frontendOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
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

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const match = req.url.match(/^\/likes\/([^/?#]+)/);
  if (!match) {
    notFound(res);
    return;
  }

  const docId = decodeURIComponent(match[1]);
  try {
    if (req.method === "GET") {
      const count = await getCount(docId);
      sendJson(res, 200, { docId, count });
      return;
    }
    if (req.method === "POST") {
      const count = await incrementCount(docId);
      sendJson(res, 200, { docId, count });
      return;
    }
    sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(port, () => {
  console.log(`API listening on ${port}`);
});
