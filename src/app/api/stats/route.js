import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Get counts in parallel
    const [
      totalStudents,
      totalCompanies,
      totalApplications,
      totalApprovedInternships,
      totalPendingInternships,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'company' } }),
      prisma.application.count(),
      prisma.internship.count({ where: { status: 'approved' } }),
      prisma.internship.count({ where: { status: 'pending' } }),
    ]);

    // Fetch Pending Items
    // 1. Fetch emails of companies whose verification_status is still 'pending'
    const pendingCompanyEmailsRaw = await prisma.$queryRawUnsafe(
      `SELECT email FROM companies WHERE verification_status = 'pending'`
    );
    const pendingEmails = pendingCompanyEmailsRaw.map(c => c.email);

    // 2. Pending Company Profiles
    const unverifiedProfiles = await prisma.companyProfile.findMany({
      where: { 
        isVerified: false,
        user: {
          email: { in: pendingEmails }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCompanies = unverifiedProfiles.map(p => ({
      userId: p.userId,
      profileId: p.id,
      name: p.user.name,
      email: p.user.email,
      companyName: p.companyName,
      website: p.website,
      location: p.location,
      createdAt: p.createdAt,
    }));

    // 2. Pending Internship Postings
    const pendingInternshipsRaw = await prisma.internship.findMany({
      where: { status: 'pending' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            companyProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingInternships = pendingInternshipsRaw.map(i => ({
      _id: i.id,
      title: i.title,
      description: i.description,
      skillsRequired: i.skillsRequired,
      stipend: i.stipend,
      duration: i.duration,
      location: i.location,
      createdAt: i.createdAt,
      company: {
        id: i.company.id,
        name: i.company.name,
        email: i.company.email,
        companyName: i.company.companyProfile?.companyName || i.company.name,
      },
    }));

    return NextResponse.json({
      counts: {
        totalStudents,
        totalCompanies,
        totalApplications,
        totalApprovedInternships,
        totalPendingInternships,
        totalPendingCompanies: pendingCompanies.length,
      },
      pendingCompanies,
      pendingInternships,
    });
  } catch (error) {
    console.error('GET Admin Stats Error:', error);
    return NextResponse.json({ error: 'Server error retrieving admin statistics.' }, { status: 500 });
  }
}
