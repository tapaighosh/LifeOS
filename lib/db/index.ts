/**
 * DB connection re-export
 * Provides a named export `connectDB` for use in API routes,
 * wrapping the singleton `dbConnect` function.
 */
export { default as connectDB } from './mongoose';
