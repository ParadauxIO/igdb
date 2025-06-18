// @ts-ignore
import postgres from 'postgres';
import * as fs from "fs/promises";
import {type SupabaseClient} from "@supabase/supabase-js";
import sampleUserJson from "../data/sample-users.json" with { type: 'json' };
import {SampleUser} from "./types.ts";

const sampleUserData = sampleUserJson as SampleUser[];
/**
 * Reads and returns the contents of a specified SQL file as a multiline string.
 *
 * @param filePath - Path to the SQL file to read
 * @returns The contents of the SQL file as a string
 * @throws Error if the file cannot be read
 */
const getFileContents = async (filePath: string): Promise<string> => {
    try {
        return fs.readFile(filePath, 'utf8');
    } catch (error: any) {
        throw new Error(`Failed to read SQL file at ${filePath}: ${error.message}`);
    }
}

const runSqlFile = async (sqlClient: ReturnType<typeof postgres>, sqlFile: string) => {
    const sql = await getFileContents(sqlFile);
    await runSql(sqlClient, sql);
    console.log("SQL file executed successfully:", sqlFile);
}

const runSql = async (sqlClient: ReturnType<typeof postgres>, sql: string) => {
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

/**
 * Deletes all users from the Supabase authentication system.
 * @param supabase
 */
const destroySupabaseUsers = async (supabase: SupabaseClient): Promise<void> => {
    let nextPageToken: string | null = null;

    try {
        do {
            // List users
            const { data, error } = await supabase.auth.admin.listUsers({ page: nextPageToken ? parseInt(nextPageToken) : undefined });

            if (error) {
                console.error('Error listing users:', error.message);
                break;
            }

            if (!data || !data.users.length) {
                break;
            }

            // Delete each user
            for (const user of data.users) {
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                if (deleteError) {
                    console.error(`Error deleting user ${user.id}:`, deleteError.message);
                } else {
                    console.log(`Deleted user ${user.id}`);
                }
            }

            // Pagination (currently listUsers doesn't provide token-based pagination, but future-proofing)
            nextPageToken = null; // Adjust as necessary if Supabase adds real pagination
        } while (nextPageToken);

        console.log('Finished deleting all users.');
    } catch (err) {
        console.error('Unexpected error while deleting users:', err);
    }
};

/**
 * Creates sample users in the Supabase authentication system.
 * @param supabase
 */
const createSupabaseUsers = async (supabase: SupabaseClient): Promise<SampleUser[]>  => {
    // Create 10 sample users, 2 as admins, 2 as updaters and 6 as viewers
    let sampleData = sampleUserData;
    for (let sampleUser of sampleData) {
        const {data} = await supabase.auth.admin.createUser({
            email: sampleUser.email,
            password: sampleUser.password,
            email_confirm: true
        })
        sampleUser.id = data?.user?.id ?? "ERROR OCCURRED";
    }
    console.log("Finished creating users.");
    return sampleData;
}

export {getFileContents, runSql, runSqlFile, createSupabasePostgresClient, destroySupabaseUsers, createSupabaseUsers}