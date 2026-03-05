import { neon } from '@neondatabase/serverless';

// Neon works great in serverless environments. Keep this server-only.
const sql = neon(process.env.DATABASE_URL!);
export default sql;
