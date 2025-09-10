# IGDB-portal

Dog life cycle management tool for the Irish Guide Dogs for the Blind. 

# Installation

In order to run this application, you will need a Supabase account.
You can sign up for a free account at [Supabase](https://supabase.com/).
You will need to create a new project and set up the database schema as defined in the `install` directory of this repository.
Please see the `install/README.md` file for more information on how to set up the software.

# Development
When you have set up your Supabase instance, you can clone this repository and run the following commands:
```bash
npm i # Install dependencies
npm run dev # Start the development server
```

You will need to modify .env to point at your own supabase instance should that be required.
This will start the app on `http://localhost:5173`.

# Color Palette
https://coolors.co/palette/264653-2a9d8f-e9c46a-f4a261-e76f51

# Styling

This project uses SASS as a CSS preprocessor. It is effectively a superset of CSS, so you can use all the normal CSS syntax,
but it also allows for nesting and variables.
Each component should have its own SASS file, which should be imported directly in the component file itself. 
The main SASS file is `src/styles/reset.scss`, which resets the default styles of the browser to a consistent baseline 
across all browsers.