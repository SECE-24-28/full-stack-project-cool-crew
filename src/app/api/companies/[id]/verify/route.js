import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function PUT(req, { params }) {
  try {
    const { id: userId } = await params; // Company User ID
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { isVerified } = body;

    if (isVerified === undefined || typeof isVerified !== 'boolean') {
      return NextResponse.json({ error: 'Please provide a boolean "isVerified" value.' }, { status: 400 });
    }

    // Verify company profile exists
    const profile = await prisma.companyProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Company profile not found for this user.' }, { status: 404 });
    }

    // Get company user details to retrieve email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (isVerified) {
      // Call generate_otp function to transition status to 'otp_sent' and get OTP
      const otpResults = await prisma.$queryRawUnsafe(
        `SELECT generate_otp($1) as otp`,
        user.email
      );
      const generatedOtp = otpResults[0]?.otp;

      // Simulate email sending
      console.log(`[EMAIL DISPATCH] Sent OTP ${generatedOtp} to official email ${user.email}`);

      return NextResponse.json({
        message: `Company details approved. OTP has been sent to their official email.`,
        status: 'otp_sent',
        mockOtp: generatedOtp, // returning the mock OTP for demonstration/testing
      });
    } else {
      // Disapprove/Reset
      await prisma.$executeRawUnsafe(
        `UPDATE companies SET verification_status = 'pending', verification_otp = NULL, otp_expiry = NULL WHERE email = $1`,
        user.email
      );

      await prisma.companyProfile.update({
        where: { userId },
        data: { isVerified: false },
      });

      return NextResponse.json({
        message: 'Company verification status reset to pending.',
        status: 'pending',
      });
    }
  } catch (error) {
    console.error('Verify Company Error:', error);
    return NextResponse.json({ error: 'Server error updating company verification.' }, { status: 500 });
  }
}
