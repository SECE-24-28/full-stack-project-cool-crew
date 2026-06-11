import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Find all users with role 'company'
    const companies = await prisma.user.findMany({
      where: { role: 'company' },
      include: {
        companyProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCompanies = companies.map(c => {
      const profile = c.companyProfile;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
        companyName: profile?.companyName || 'N/A',
        website: profile?.website || '',
        location: profile?.location || '',
        description: profile?.description || '',
        isVerified: profile?.isVerified || false,
        profileId: profile?.id || null,
      };
    });

    return NextResponse.json(formattedCompanies);
  } catch (error) {
    console.error('GET Companies Error:', error);
    return NextResponse.json({ error: 'Server error fetching companies.' }, { status: 500 });
  }
}
