import db from './connection.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  logger.info('Database schema initialized successfully');
} catch (error) {
  logger.error('Failed to initialize database schema', { error });
  process.exit(1);
}
