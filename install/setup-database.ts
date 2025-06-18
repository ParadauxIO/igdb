import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
    createSupabasePostgresClient,
    createSupabaseUsers,
    destroySupabaseUsers,
    runSqlFile
} from "./partials/setup-utils.ts";
import {createDogs, createUsers} from "./partials/data-utils.ts";
dotenv.config({path: './install/.env'});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const withSampleData = process.argv.includes('--with-sample-data');

if (!supabaseUrl || !supabaseKey || !dbPassword) {
    console.error('Error: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_DB_PASSWORD environment variables are not set');
    process.exit(1);
}

console.log('Connecting to Supabase PostgreSQL database...');
const supabase = createClient(supabaseUrl, supabaseKey);
const db = createSupabasePostgresClient(supabaseUrl, dbPassword);

const run = async () => {
    try {
        console.log("Dropping and creating tables/policies...");
        await dropAndCreateTablesAndPolicies();
        console.log("Dropping existing users...");
        await destroySupabaseUsers(supabase); // Delete all current users in Supabase
        if (withSampleData) {
            console.log('Seeding sample data...');
            const sampleUsers = await createSupabaseUsers(supabase); // Create the users in Supabase
            await createUsers(supabase, sampleUsers); // Create the row in the users table
            await createDogs(supabase, sampleUsers); // Create the dogs in Supabase
        }
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
    // await runSqlFile(db, "./sql/seed-data.sql");
}

run();