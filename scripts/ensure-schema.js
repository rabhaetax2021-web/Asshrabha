/**
 * ensure-schema.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Ensures the PostgreSQL database has all tables, enums, columns, and indexes
 * that match the Prisma schema. This runs on every startup and is idempotent.
 *
 * It reads prisma/schema.prisma, parses the models/enums, and creates any
 * missing database objects via raw SQL (CREATE TABLE IF NOT EXISTS, etc.).
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ─── Load .env ──────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  return content.split('\n').reduce((acc, line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))$/);
    if (m) acc[m[1]] = m[2] ?? m[3] ?? m[4];
    return acc;
  }, {});
}

// ─── Prisma-to-PG type mapping ──────────────────────────────────────────────
function prismaTypeToPg(prismaType, isArray) {
  const base = (() => {
    switch (prismaType) {
      case 'String': return 'TEXT';
      case 'Int': return 'INTEGER';
      case 'Float': return 'DOUBLE PRECISION';
      case 'Boolean': return 'BOOLEAN';
      case 'DateTime': return 'TIMESTAMP(3)';
      case 'Json': return 'JSONB';
      default: return `"${prismaType}"`; // enum type
    }
  })();
  return isArray ? `${base}[]` : base;
}

// ─── Parse schema.prisma ────────────────────────────────────────────────────
function parseSchema(schemaPath) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  const lines = content.split('\n');

  const enumNames = new Set();
  const modelNames = new Set();
  const enums = [];
  const models = [];
  let current = null;
  let currentType = null; // 'enum' | 'model'

  // First pass: collect all enum and model names
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('enum ')) {
      enumNames.add(line.replace('enum ', '').replace('{', '').trim());
    }
    if (line.startsWith('model ')) {
      modelNames.add(line.replace('model ', '').replace('{', '').trim());
    }
  }

  const knownScalarTypes = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json']);

  // Second pass: parse enums and models
  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('enum ')) {
      const name = line.replace('enum ', '').replace('{', '').trim();
      current = { name, values: [] };
      currentType = 'enum';
      continue;
    }

    if (line.startsWith('model ')) {
      const name = line.replace('model ', '').replace('{', '').trim();
      current = { name, fields: [], uniqueConstraints: [], indexes: [] };
      currentType = 'model';
      continue;
    }

    if (line === '}' && current) {
      if (currentType === 'enum') enums.push(current);
      if (currentType === 'model') models.push(current);
      current = null;
      currentType = null;
      continue;
    }

    if (!current) continue;

    if (currentType === 'enum') {
      if (line && !line.startsWith('//') && !line.startsWith('@@')) {
        current.values.push(line);
      }
      continue;
    }

    if (currentType === 'model') {
      // Handle @@unique
      if (line.startsWith('@@unique')) {
        const match = line.match(/@@unique\(\[([^\]]+)\]/);
        if (match) {
          current.uniqueConstraints.push(
            match[1].split(',').map(f => f.trim())
          );
        }
        continue;
      }

      // Handle @@index
      if (line.startsWith('@@index')) {
        const match = line.match(/@@index\(\[([^\]]+)\]/);
        if (match) {
          current.indexes.push(
            match[1].split(',').map(f => f.trim())
          );
        }
        continue;
      }

      // Skip comments, empty lines, @@
      if (!line || line.startsWith('//') || line.startsWith('@@')) continue;

      // Parse field
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const fieldName = parts[0];
      let rawType = parts[1];

      // Detect optional and array
      const isOptional = rawType.endsWith('?');
      const isArray = rawType.endsWith('[]');
      let cleanType = rawType;
      if (isOptional) cleanType = cleanType.slice(0, -1);
      if (isArray) cleanType = cleanType.slice(0, -2);

      // *** KEY: Skip relation fields ***
      // A field is a relation if its type is a model name (not enum, not scalar)
      if (modelNames.has(cleanType)) {
        continue; // This is a relation field, skip it
      }

      // Also skip if the line contains @relation()
      if (line.includes('@relation(')) {
        continue;
      }

      // Determine if it's a scalar or enum type
      const isScalar = knownScalarTypes.has(cleanType);
      const isEnum = enumNames.has(cleanType);

      // If it's neither scalar nor enum, it's probably a relation we missed, skip
      if (!isScalar && !isEnum) {
        continue;
      }

      const field = {
        name: fieldName,
        type: cleanType,
        isOptional,
        isArray,
        isId: line.includes('@id'),
        isUnique: line.includes('@unique'),
        hasDefault: line.includes('@default'),
        isUpdatedAt: line.includes('@updatedAt'),
        isEnum,
      };

      // Parse @default value
      if (field.hasDefault) {
        const defMatch = line.match(/@default\(([^)]+)\)/);
        if (defMatch) {
          field.defaultValue = defMatch[1];
        }
      }

      current.fields.push(field);
    }
  }

  return { enums, models, enumNames: Array.from(enumNames) };
}

// ─── SQL generation ─────────────────────────────────────────────────────────
function getDefaultSQL(field) {
  if (!field.hasDefault || !field.defaultValue) return '';
  const val = field.defaultValue;
  if (val === 'now()') return " DEFAULT CURRENT_TIMESTAMP";
  if (val === 'cuid()' || val === 'uuid()') return ''; // generated in app
  if (val === 'true') return ' DEFAULT true';
  if (val === 'false') return ' DEFAULT false';
  if (val === '0') return ' DEFAULT 0';
  if (/^\d+(\.\d+)?$/.test(val)) return ` DEFAULT ${val}`;
  // String default
  if (val.startsWith('"') && val.endsWith('"')) {
    return ` DEFAULT '${val.slice(1, -1)}'`;
  }
  // Enum default
  if (field.isEnum) {
    return ` DEFAULT '${val}'::"${field.type}"`;
  }
  return '';
}

async function ensureSchema(client, enums, models) {
  let created = 0;
  let altered = 0;

  // 1. Ensure all enums exist with all values
  for (const en of enums) {
    const check = await client.query(
      `SELECT 1 FROM pg_type WHERE typname = $1`, [en.name]
    );
    if (!check.rows.length) {
      const vals = en.values.map(v => `'${v}'`).join(', ');
      await client.query(`CREATE TYPE "${en.name}" AS ENUM (${vals})`);
      console.log(`  ✅ Created enum "${en.name}"`);
      created++;
    } else {
      // Ensure all values exist
      for (const val of en.values) {
        const valCheck = await client.query(
          `SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1) AND enumlabel = $2`,
          [en.name, val]
        );
        if (!valCheck.rows.length) {
          await client.query(`ALTER TYPE "${en.name}" ADD VALUE IF NOT EXISTS '${val}'`);
          console.log(`  ✅ Added value '${val}' to enum "${en.name}"`);
          altered++;
        }
      }
    }
  }

  // 2. Ensure all tables exist
  for (const model of models) {
    const tableName = model.name;
    const tableCheck = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [tableName]
    );

    if (!tableCheck.rows.length) {
      // Build CREATE TABLE
      const colDefs = [];
      for (const field of model.fields) {
        const pgType = prismaTypeToPg(field.type, field.isArray);
        const nullable = field.isOptional ? '' : ' NOT NULL';
        const pk = field.isId ? ' PRIMARY KEY' : '';
        const unique = field.isUnique ? ' UNIQUE' : '';
        const def = getDefaultSQL(field);
        colDefs.push(`"${field.name}" ${pgType}${nullable}${pk}${unique}${def}`);
      }

      if (colDefs.length === 0) {
        console.log(`  ⚠️  Skipping "${tableName}" — no columns parsed (likely already managed by Prisma)`);
        continue;
      }

      const sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${colDefs.join(',\n  ')}\n)`;
      await client.query(sql);
      console.log(`  ✅ Created table "${tableName}"`);
      created++;
    } else {
      // Table exists — check for missing columns
      for (const field of model.fields) {
        const colCheck = await client.query(
          `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
          [tableName, field.name]
        );
        if (!colCheck.rows.length) {
          const pgType = prismaTypeToPg(field.type, field.isArray);
          const def = getDefaultSQL(field);
          const nullDefault = field.isOptional ? '' : (def ? '' : (field.type === 'Boolean' ? ' DEFAULT false' : (field.type === 'Int' || field.type === 'Float' ? ' DEFAULT 0' : '')));
          try {
            await client.query(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${field.name}" ${pgType}${def}${nullDefault}`);
            console.log(`  ✅ Added column "${tableName}"."${field.name}"`);
            altered++;
          } catch (e) {
            console.log(`  ⚠️  Could not add "${tableName}"."${field.name}": ${e.message}`);
          }
        }
      }
    }

    // 3. Ensure indexes (silently)
    for (const idx of model.indexes) {
      const idxName = `idx_${tableName}_${idx.join('_')}`.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 63);
      const cols = idx.map(c => `"${c}"`).join(', ');
      try {
        await client.query(`CREATE INDEX IF NOT EXISTS "${idxName}" ON "${tableName}" (${cols})`);
      } catch (e) { /* index may already exist with different name */ }
    }

    // 4. Ensure unique constraints (silently)
    for (const uc of model.uniqueConstraints) {
      const ucName = `uq_${tableName}_${uc.join('_')}`.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 63);
      const cols = uc.map(c => `"${c}"`).join(', ');
      try {
        const ucCheck = await client.query(
          `SELECT 1 FROM pg_constraint WHERE conname = $1`, [ucName]
        );
        if (!ucCheck.rows.length) {
          await client.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${ucName}" UNIQUE (${cols})`);
        }
      } catch (e) { /* constraint may already exist */ }
    }
  }

  return { created, altered };
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv();
  const connectionString = process.env.DATABASE_URL || env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('\n🔍 Checking database schema...');
  const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ prisma/schema.prisma not found');
    process.exit(1);
  }

  const { enums, models } = parseSchema(schemaPath);
  console.log(`   Found ${enums.length} enums, ${models.length} models in schema`);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const { created, altered } = await ensureSchema(client, enums, models);
    if (created === 0 && altered === 0) {
      console.log('   ✅ Schema is up to date — no changes needed');
    } else {
      console.log(`   ✅ Schema updated: ${created} created, ${altered} altered`);
    }
  } catch (e) {
    console.error('❌ Schema check failed:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
