import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {createSupabasePostgresClient, runSqlFile} from "./partials/setup-utils";
dotenv.config({path: './install/.env'});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !supabaseKey || !dbPassword) {
    console.error('Error: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_DB_PASSWORD environment variables are not set');
    process.exit(1);
}

console.log('Connecting to Supabase PostgreSQL database...');
const supabase = createClient(supabaseUrl, supabaseKey);
const db = createSupabasePostgresClient(supabaseUrl, dbPassword);

const run = async () => {
    try {
        await dropAndCreateTablesAndPolicies();
    } catch (err) {
        console.error('Setup error:', err);
        console.error('Please check your connection details and ensure your IP is allowed in Supabase database settings');
    } finally {
        await db.end();
    }
}

const dropAndCreateTablesAndPolicies = async () => {
    await runSqlFile(db, "./sql/drop-tables.sql");
    await runSqlFile(db, "./sql/create-tables.sql");
    await runSqlFile(db, "./sql/seed-data.sql");
}

run();