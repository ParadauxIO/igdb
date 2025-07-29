# Installation Instructions

> ⚠️ Ensure you have run `npm i` in the root of the project to install all dependencies.

## Setup the Supabase project

> This follows on from README.md in the root of the project.

Configure the `.env` file in the root of the project with your Supabase project details, filling in the following variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_kEY=
```

And in the `install` directory, create a `.env` file with the following variables:
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DATABASE_PASSWORD=
```

You can now set up the database schema by running the following command:
```
npx tsx ./install/setup-database.ts
```

If you wish to create the sample data and users, you can run the following command instead:
```
npx tsx ./install/setup-database.ts --with-sample-data
```

> ⚠️ For security reasons, we recommend that you delete `install/.env` so that the database credentials are not stored in plain text long-term.

## Run the application
To run the application, you can use the following command in the root of the project:

```bash
npm run dev
```

This will start the development server on `http://localhost:5173`.

# Install steps:

Create project, grabbing db password, service role
Change install .env
Run setup-database with sample data or not. 

Run policies
Run triggers
Deploy functions
Run migrations
Grab anon key and URL from Supabase dashboard
Change .env in frontend 