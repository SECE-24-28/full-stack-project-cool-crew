-- ==========================================
-- InternBridge Admin Verification SQL Schema
-- Target Database: PostgreSQL
-- ==========================================

-- 1. Companies Table definition
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'otp_sent', 'approved'
  verification_otp VARCHAR(10),
  otp_expiry TIMESTAMP,
  verified_at TIMESTAMP
);

-- 2. PL/pgSQL function for random 6-digit OTP generation and expiry setup
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

-- 3. PL/pgSQL function for OTP validation and activation
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

-- ==========================================
-- Admin / Client OTP SQL Queries
-- ==========================================

-- Admin Approval Query (generates OTP):
-- SELECT generate_otp('company@example.com');

-- Resend OTP Query (regenerates OTP):
-- SELECT generate_otp('company@example.com');

-- OTP Verification Query (returns BOOLEAN):
-- SELECT verify_otp('company@example.com', '123456');
