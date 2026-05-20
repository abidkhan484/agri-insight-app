# Plan: Fix Supabase Environment Variables in map-pwa

## Problem
The `map-pwa` sub-project fails to initialize Supabase because it cannot find the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables. These variables are defined in the workspace root `.env` file, but Vite only looks in the sub-project root (`map-pwa/`) by default.

## Solution
Configure Vite in `map-pwa` to look for environment variables in the parent directory.

## Steps
1. Update `map-pwa/vite.config.js` to add `envDir: '../'`.
2. Verify that the configuration is valid.

## Verification
- Run a build or check if the variables are loaded (can be verified by running a script that imports vite and checks config, or just applying the fix as it is standard Vite behavior).
