import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import argon2 from 'argon2';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function createAdmin() {
  console.log('Creating Admin User...');
  
  try {
    const name = await question('Name: ');
    const email = await question('Email: ');
    
    // Quick validation
    if (!name || !email || !email.includes('@')) {
      console.error('Invalid name or email');
      process.exit(1);
    }
    
    const password = await question('Password (min 8 chars): ');
    
    if (password.length < 8) {
      console.error('Password must be at least 8 characters');
      process.exit(1);
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool, { schema });
    
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email)
    });
    
    if (existingUser) {
      console.error('User with this email already exists');
      await pool.end();
      process.exit(1);
    }
    
    const passwordHash = await argon2.hash(password);
    
    await db.insert(schema.users).values({
      name,
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
    });
    
    console.log(`Successfully created admin user: ${email}`);
    
    await pool.end();
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    rl.close();
  }
}

createAdmin();
