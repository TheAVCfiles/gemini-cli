#!/usr/bin/env node
/**
 * Tiny SQL migration runner with ZERO framework deps.
 * - Reads ./migrations/*.sql in lexical order
 * - Stores applied migrations in schema_migrations
 *
 * Usage:
 *   node scripts/migrate.mjs up
 *   node scripts/migrate.mjs status
 *   node scripts/migrate.mjs down   (rolls back last migration if rollback block exists)
 *
 * Conventions in each .sql:
 *   --@UP
 *     ... up SQL ...
 *   --@DOWN
 *     ... optional down SQL ...
 */
import fs from "fs";
import path from "path";
import pg from "pg";

const { Client } = pg;

const cmd = process.argv[2] || "up";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/enhancement";

const migrationsDir = path.resolve(process.cwd(), "migrations");

function splitUpDown(sql) {
  const upMarker = "--@UP";
  const downMarker = "--@DOWN";
  const upIdx = sql.indexOf(upMarker);
  if (upIdx === -1) return { up: sql, down: null };
  const downIdx = sql.indexOf(downMarker);
  if (downIdx === -1) {
    return { up: sql.slice(upIdx + upMarker.length), down: null };
  }
  const up = sql.slice(upIdx + upMarker.length, downIdx);
  const down = sql.slice(downIdx + downMarker.length);
  return { up, down };
}

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id serial PRIMARY KEY,
      filename text UNIQUE NOT NULL,
      applied_at timestamptz DEFAULT now()
    );
  `);
}

function listSqlFiles() {
  if (!fs.existsSync(migrationsDir)) throw new Error(`Missing migrations dir: ${migrationsDir}`);
  return fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();
}

async function getApplied(client) {
  const { rows } = await client.query("SELECT filename, applied_at FROM schema_migrations ORDER BY filename ASC;");
  return rows;
}

async function applyOne(client, filename) {
  const full = path.join(migrationsDir, filename);
  const raw = fs.readFileSync(full, "utf8");
  const { up } = splitUpDown(raw);
  await client.query("BEGIN");
  try {
    await client.query(up);
    await client.query("INSERT INTO schema_migrations (filename) VALUES ($1);", [filename]);
    await client.query("COMMIT");
    console.log(`✅ applied ${filename}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`❌ failed ${filename}`);
    throw e;
  }
}

async function rollbackLast(client) {
  const { rows } = await client.query("SELECT filename FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;");
  if (!rows.length) {
    console.log("Nothing to rollback.");
    return;
  }
  const filename = rows[0].filename;
  const full = path.join(migrationsDir, filename);
  const raw = fs.readFileSync(full, "utf8");
  const { down } = splitUpDown(raw);
  if (!down || !down.trim()) {
    throw new Error(`No --@DOWN section in ${filename}. Refusing to guess rollback.`);
  }
  await client.query("BEGIN");
  try {
    await client.query(down);
    await client.query("DELETE FROM schema_migrations WHERE filename = $1;", [filename]);
    await client.query("COMMIT");
    console.log(`↩️ rolled back ${filename}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`❌ rollback failed ${filename}`);
    throw e;
  }
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  await ensureTable(client);

  const files = listSqlFiles();
  const applied = await getApplied(client);
  const appliedSet = new Set(applied.map(r => r.filename));

  if (cmd === "status") {
    console.log("DATABASE_URL:", DATABASE_URL);
    console.log("\nApplied:");
    for (const r of applied) console.log(`  - ${r.filename} @ ${r.applied_at}`);
    console.log("\nPending:");
    for (const f of files) if (!appliedSet.has(f)) console.log(`  - ${f}`);
    await client.end();
    return;
  }

  if (cmd === "down") {
    await rollbackLast(client);
    await client.end();
    return;
  }

  // default: up
  for (const f of files) {
    if (!appliedSet.has(f)) {
      await applyOne(client, f);
    }
  }
  console.log("✅ migrations up-to-date");
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
