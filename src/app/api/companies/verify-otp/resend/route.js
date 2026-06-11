import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'company') {
      return NextResponse.json(
        { error: 'Unauthorized. Only company users can request OTP resend.' },
        { status: 403 }
      );
    }

    // Call generate_otp to generate new OTP and update expiry
    const otpResults = await prisma.$queryRawUnsafe(
      `SELECT generate_otp($1) as otp`,
      authUser.email
    );
    
    const generatedOtp = otpResults[0]?.otp;

    // Simulate email dispatch
    console.log(`[EMAIL DISPATCH] Resent OTP ${generatedOtp} to official email ${authUser.email}`);

    return NextResponse.json({
      message: `A new 6-digit verification OTP has been sent.`,
      status: 'otp_sent',
      mockOtp: generatedOtp, // returning the mock OTP for demonstration/testing
    });
  } catch (error) {
    console.error('Resend OTP API Error:', error);
    return NextResponse.json(
      { error: 'Server error generating new OTP.' },
      { status: 500 }
    );
  }
}
