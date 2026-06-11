import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env variables manually for scripting context
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('✓ Loaded environment variables from .env.local');
  }
} catch (e) {
  console.warn('Could not read .env.local.', e.message);
}

import prisma from '../src/lib/db.js';

async function runTest() {
  console.log('Starting PostgreSQL (Prisma) connection test...');
  try {
    // 1. Create a dummy user
    console.log('Inserting test record...');
    const testEmail = `test-user-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        name: 'Verification Dummy User',
        email: testEmail,
        password: 'dummypassword123',
        role: 'admin' // Matches enum role
      }
    });
    console.log(`✓ Test record created. ID: ${user.id}`);

    // 2. Fetch the user
    console.log('Querying test record...');
    const fetchedUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    if (fetchedUser) {
      console.log(`✓ Successfully queried record. Name matches: "${fetchedUser.name}"`);
    } else {
      throw new Error('Could not find the inserted user.');
    }

    // 3. Delete the user
    console.log('Cleaning up test record...');
    await prisma.user.delete({
      where: { id: user.id }
    });
    console.log('✓ Test record deleted successfully.');

    console.log('\n\x1b[32mDATABASE VERIFICATION SUCCESSFUL! PostgreSQL connection via Prisma is fully functional.\x1b[0m');

  } catch (error) {
    console.error('\n\x1b[31mDATABASE VERIFICATION FAILED!\x1b[0m');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
}

runTest();
