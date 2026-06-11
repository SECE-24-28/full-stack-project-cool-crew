import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'company') {
      return NextResponse.json(
        { error: 'Unauthorized. Only company users can verify OTP.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { otp } = body;

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit OTP.' },
        { status: 400 }
      );
    }

    // Call PL/pgSQL function verify_otp
    const verifyResults = await prisma.$queryRawUnsafe(
      `SELECT verify_otp($1, $2) as verified`,
      authUser.email,
      otp
    );
    
    const isVerified = verifyResults[0]?.verified;

    if (isVerified) {
      // Sync the CompanyProfile verification status in Prisma
      await prisma.companyProfile.update({
        where: { userId: authUser.id },
        data: { isVerified: true },
      });

      return NextResponse.json({
        message: '✓ OTP verified successfully! Your company status is now approved.',
        status: 'approved',
      });
    }

    // If verification failed, check whether it was incorrect or expired
    const companyRecords = await prisma.$queryRawUnsafe(
      `SELECT verification_otp, otp_expiry, verification_status FROM companies WHERE email = $1`,
      authUser.email
    );

    const record = companyRecords[0];

    if (!record) {
      return NextResponse.json(
        { error: 'Company registration record not found.' },
        { status: 404 }
      );
    }

    if (record.verification_status === 'approved') {
      return NextResponse.json({
        message: 'Your company profile has already been approved.',
        status: 'approved',
      });
    }

    if (!record.verification_otp) {
      return NextResponse.json(
        { error: 'No active OTP found. Please request verification first.' },
        { status: 400 }
      );
    }

    if (record.verification_otp !== otp) {
      return NextResponse.json(
        { error: 'Incorrect OTP entered. Please verify the code and try again.' },
        { status: 400 }
      );
    }

    if (new Date(record.otp_expiry) <= new Date()) {
      return NextResponse.json(
        { error: 'The OTP has expired (validity is 5 minutes). Please request a new code.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'OTP verification failed.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Verify OTP API Error:', error);
    return NextResponse.json(
      { error: 'Server error verifying OTP.' },
      { status: 500 }
    );
  }
}
