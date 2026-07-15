
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DB_CONFIG = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'peace_and_security',
};

async function reset() {
    const client = new Client(DB_CONFIG);
    await client.connect();
    const hash = await bcrypt.hash('Password123!', 10);
    await client.query('UPDATE users SET password = $1, "isPasswordSet" = true WHERE role = \'SYSTEM_SUPER_ADMIN\'', [hash]);
    console.log('Admin password reset to Password123!');
    await client.end();
}
reset();
