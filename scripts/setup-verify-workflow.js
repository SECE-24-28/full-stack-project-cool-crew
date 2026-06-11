import prisma from '../src/lib/db.js';

const createTableSQL = `
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_otp VARCHAR(10),
  otp_expiry TIMESTAMP,
  verified_at TIMESTAMP
);
`;

const createGenerateOtpSQL = `
CREATE OR REPLACE FUNCTION generate_otp(company_email VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    new_otp VARCHAR(6);
BEGIN
    -- Generate a random 6-digit number between 100000 and 999999
    new_otp := floor(random() * (999999 - 100000 + 1) + 100000)::VARCHAR;
    
    -- Update the company details with the OTP, 5-minute expiry, and status
    UPDATE companies 
    SET verification_otp = new_otp,
        otp_expiry = CURRENT_TIMESTAMP + INTERVAL '5 minutes',
        verification_status = 'otp_sent'
    WHERE email = company_email;
    
    RETURN new_otp;
END;
$$ LANGUAGE plpgsql;
`;

const createVerifyOtpSQL = `
CREATE OR REPLACE FUNCTION verify_otp(company_email VARCHAR, entered_otp VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    valid BOOLEAN := FALSE;
    company_record RECORD;
BEGIN
    -- Fetch company details
    SELECT * INTO company_record FROM companies WHERE email = company_email;
    
    IF company_record IS NULL THEN
        RAISE EXCEPTION 'Company not found';
    END IF;
    
    -- Check if OTP matches and is not expired
    IF company_record.verification_otp = entered_otp AND company_record.otp_expiry > CURRENT_TIMESTAMP THEN
        UPDATE companies
        SET verification_status = 'approved',
            verified_at = CURRENT_TIMESTAMP,
            verification_otp = NULL,
            otp_expiry = NULL
        WHERE email = company_email;
        valid := TRUE;
    END IF;
    
    RETURN valid;
END;
$$ LANGUAGE plpgsql;
`;

async function main() {
  try {
    console.log('Running SQL migrations for Admin Verification workflow sequentially...');
    
    console.log('1. Creating companies table...');
    await prisma.$executeRawUnsafe(createTableSQL);
    
    console.log('2. Creating generate_otp function...');
    await prisma.$executeRawUnsafe(createGenerateOtpSQL);
    
    console.log('3. Creating verify_otp function...');
    await prisma.$executeRawUnsafe(createVerifyOtpSQL);

    console.log('4. Migrating existing companies into companies table...');
    const migrateSQL = `
    INSERT INTO companies (company_name, email, password, verification_status, verified_at)
    SELECT cp."companyName", u.email, u.password, 
           CASE WHEN cp."isVerified" = true THEN 'approved' ELSE 'pending' END,
           CASE WHEN cp."isVerified" = true THEN CURRENT_TIMESTAMP ELSE NULL END
    FROM "CompanyProfile" cp
    JOIN "User" u ON cp."userId" = u.id
    ON CONFLICT (email) DO NOTHING;
    `;
    await prisma.$executeRawUnsafe(migrateSQL);
    
    console.log('\n\x1b[32m✓ PostgreSQL schema, functions, and data migration completed successfully!\x1b[0m');
  } catch (error) {
    console.error('Failed to setup database objects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
