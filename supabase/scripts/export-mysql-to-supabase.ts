/**
 * Export MySQL data as PostgreSQL INSERT statements for Supabase import.
 *
 * Usage (from project root, with DB_* env vars set):
 *   npx tsx supabase/scripts/export-mysql-to-supabase.ts > supabase/scripts/data_import.sql
 *
 * Then run data_import.sql + reset_sequences.sql in Supabase SQL Editor.
 */
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

function pgEscape(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Buffer.isBuffer(value)) return `'\\x${value.toString('hex')}'`;
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

function buildInsert(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `-- ${table}: no rows\n`;
  const cols = Object.keys(rows[0]);
  const lines = rows.map((row) => {
    const vals = cols.map((c) => pgEscape(row[c]));
    return `(${vals.join(', ')})`;
  });
  return [
    `-- ${table}: ${rows.length} rows`,
    `insert into public.${table} (${cols.join(', ')})`,
    `values\n${lines.join(',\n')};\n`,
  ].join('\n');
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3308', 10),
    database: process.env.DB_NAME || 'donovan_db',
    user: process.env.DB_USER || 'donovan_user',
    password: process.env.DB_PASSWORD || 'donovan_password',
  });

  console.log('-- XoloDojo MySQL → Supabase data export');
  console.log('-- Generated:', new Date().toISOString());
  console.log('-- Run AFTER 20260210000000_initial_schema.sql\n');

  const tables = [
    'users',
    'user_profiles',
    'user_wallets',
    'user_pins',
    'globe_pin_bookmarks',
    // user_sessions omitted by default — users re-login after migration
  ];

  for (const table of tables) {
    const [rows] = await pool.query<Record<string, unknown>[]>(`SELECT * FROM ${table}`);
    const list = rows as unknown as Record<string, unknown>[];

    // Normalize types for PostgreSQL
    for (const row of list) {
      if ('is_connected' in row && typeof row.is_connected === 'number') {
        row.is_connected = row.is_connected === 1;
      }
      if ('preferences' in row && typeof row.preferences === 'string') {
        try {
          row.preferences = JSON.parse(row.preferences);
        } catch {
          row.preferences = {};
        }
      }
      if ('socials' in row && typeof row.socials === 'string') {
        try {
          row.socials = JSON.parse(row.socials);
        } catch {
          row.socials = null;
        }
      }
    }

    console.log(buildInsert(table, list));
  }

  console.log('-- After import, run: supabase/scripts/reset_sequences.sql');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
