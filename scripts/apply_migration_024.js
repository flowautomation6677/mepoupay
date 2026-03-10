require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyStorageRLS() {
    console.log('--- Starting Migration 024 (Storage RLS) ---');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
    });

    try {
        await client.connect();
        const sqlPath = path.join(__dirname, '../database/migrations/024_storage_rls_avatars.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(sql);
        console.log('✅ SQL executed successfully (RLS Policies for Storage applied).');
    } catch (err) {
        console.error('❌ SQL execution error:', err.message);
    } finally {
        await client.end();
    }
}

applyStorageRLS();
