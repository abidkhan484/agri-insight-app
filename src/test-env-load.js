import { config } from './config/index.js';

console.log('--- Environment Loading Test ---');
console.log('Timezone:', config.timezone);
console.log('Log Level:', config.logLevel);
console.log('Port:', config.port);
console.log('Has Bot Token:', !!config.botToken);
console.log('Has Supabase URL:', !!config.supabaseUrl);
console.log('Has Supabase Key:', !!config.supabaseKey);
console.log('---------------------------------');
