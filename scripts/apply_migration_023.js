require('dotenv').config();
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
    console.log('--- Starting Migration 023 ---');

    // 1. Run SQL Migration via pg
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
    });

    try {
        await client.connect();
        const sqlPath = path.join(__dirname, '../database/migrations/023_add_avatar_url.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(sql);
        console.log('✅ SQL executed successfully (avatar_url added to profiles).');
    } catch (err) {
        console.error('❌ SQL execution error:', err.message);
    } finally {
        await client.end();
    }

    // 2. Ensure Storage Bucket exists via Supabase JS
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        console.log('Checking Storage Buckets...');
        try {
            const { data, error } = await supabase.storage.createBucket('avatars', {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
                fileSizeLimit: 5242880 // 5MB
            });

            if (error) {
                if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
                    console.log('✅ Storage bucket "avatars" already exists.');
                } else {
                    console.error('❌ Error creating bucket:', error);
                }
            } else {
                console.log('✅ Storage bucket "avatars" created successfully.');
            }
        } catch (e) {
            console.error('❌ Unexpected error creating bucket:', e);
        }
    } else {
        console.log('⚠️ Could not check storage bucket due to missing env variables.');
    }
}

applyMigration();
