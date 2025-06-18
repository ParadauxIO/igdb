// @ts-ignore
import postgres from 'postgres';
import * as fs from "fs/promises";

/**
 * Reads and returns the contents of a specified SQL file as a multiline string.
 *
 * @param filePath - Path to the SQL file to read
 * @returns The contents of the SQL file as a string
 * @throws Error if the file cannot be read
 */
const getSqlFileContents = async (filePath: string): Promise<string> => {
    try {
        return fs.readFile(filePath, 'utf8');
    } catch (error) {
        throw new Error(`Failed to read SQL file at ${filePath}: ${error.message}`);
    }
}

const runSqlFile = async (sqlClient: ReturnType<typeof postgres>, sqlFile: string) => {
    const sql = await getSqlFileContents(sqlFile);

    try {
        await sqlClient.unsafe(sql);
        console.log('Tables and policies created successfully');
    } catch (err) {
        console.error('Error creating schema:', err);
    }
}

/**
 * Creates a PostgreSQL client configured for Supabase.
 *
 * @param supabaseUrl - Your Supabase project URL
 * @param password - Your Supabase service role key
 * @returns Configured postgres client
 */
const createSupabasePostgresClient = (supabaseUrl: string, password: string) => {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

    return postgres({
        host: 'aws-0-eu-west-1.pooler.supabase.com', // Updated host to use db. prefix
        port: 5432,
        database: 'postgres',
        username: `postgres.${projectRef}`,
        password: password,
        ssl: true, // Enable SSL for Supabase connections
        connect_timeout: 30, // Increase connection timeout to 30 seconds
        idle_timeout: 30, // Set idle timeout
        max_lifetime: 60 * 30 // Connection max lifetime in seconds
    });
}

export {getSqlFileContents, runSqlFile, createSupabasePostgresClient}