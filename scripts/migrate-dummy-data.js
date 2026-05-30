const { Pool } = require('pg');
const seed = require('./seed-data');

const config = {
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER || 'biomedical_user',
  password: process.env.PG_PASSWORD || 'biomedical123',
  database: process.env.PG_DATABASE || 'biomedical'
};

const adminConfig = {
  ...config,
  database: 'postgres'
};

const schemaName = 'pdhs';

async function createDatabaseIfNeeded() {
  const adminPool = new Pool(adminConfig);
  try {
    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database]
    );

    if (result.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE ${config.database}`);
      console.log(`Created database ${config.database}`);
    } else {
      console.log(`Database ${config.database} already exists`);
    }
  } finally {
    await adminPool.end();
  }
}

async function migrateSeed() {
  const pool = new Pool(config);
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.seed_snapshot (
        name TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const payload = {
      currentUser: seed.users[0],
      districts: seed.districts,
      institutions: seed.institutions,
      users: seed.users,
      suppliers: seed.suppliers,
      inventoryItems: seed.inventoryItems,
      equipment: seed.equipment,
      assignments: seed.assignments,
      repairRequests: seed.repairRequests,
      workOrders: seed.workOrders,
      procurementPlans: seed.procurementPlans,
      purchaseOrders: seed.purchaseOrders,
      grns: seed.grns,
      auditLogs: seed.auditLogs
    };

    await pool.query(
      `INSERT INTO ${schemaName}.seed_snapshot (name, payload)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET
         payload = EXCLUDED.payload,
         updated_at = NOW()`,
      ['biomed_seed', JSON.stringify(payload)]
    );

    const stats = await pool.query(`
      SELECT name, jsonb_array_length(payload->'equipment') AS equipment_count,
             jsonb_array_length(payload->'repairRequests') AS repair_count,
             jsonb_array_length(payload->'purchaseOrders') AS po_count
      FROM ${schemaName}.seed_snapshot
      WHERE name = 'biomed_seed'
    `);

    console.log('Migration complete.');
    console.table(stats.rows);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('Starting PostgreSQL migration...');
  await createDatabaseIfNeeded();
  await migrateSeed();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
