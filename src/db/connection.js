import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import logger from '../config/logger.js';
import { dirname } from 'path';
import { mkdirSync } from 'fs';

mkdirSync(dirname(config.dbPath), { recursive: true });

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

logger.info('Database connection established', { path: config.dbPath });

process.on('exit', () => db.close());

export default db;
