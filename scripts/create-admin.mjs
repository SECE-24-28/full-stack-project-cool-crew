import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load env variables manually for scripting context
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (e) {
  console.warn('Could not read .env.local.', e.message);
}

import prisma from '../src/lib/db.js';

const email = 'admin@internbridge.com';
const password = 'adminpassword123';
const name = 'System Admin';

async function createAdmin() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existing) {
      console.log(`Admin account already exists: ${email}`);
      process.exit(0);
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin' // Matches enum Role
      }
    });
    
    console.log('\n\x1b[32m✓ Admin account seeded successfully in PostgreSQL!\x1b[0m');
    console.log(`- Email:    ${email}`);
    console.log(`- Password: ${password}`);
    console.log('\nYou can now log in using these credentials.');
  } catch (err) {
    console.error('Failed to create admin user:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

createAdmin();
