import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

// GET all applications submitted by the logged-in student
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized. Only students can access their applications list.' },
        { status: 403 }
      );
    }

    // Find all applications for the student
    const applications = await prisma.application.findMany({
      where: { studentId: authUser.id },
      include: {
        internship: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedApplications = applications.map(app => {
      const companyInfo = app.internship.company;
      const profile = companyInfo.companyProfile;
      return {
        _id: app.id,
        status: app.status,
        resumeUrl: app.resumeUrl,
        aiMatchScore: app.aiMatchScore,
        appliedAt: app.appliedAt,
        internship: {
          id: app.internship.id,
          title: app.internship.title,
          stipend: app.internship.stipend,
          location: app.internship.location,
          companyName: profile?.companyName || companyInfo.name,
        },
      };
    });

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error('GET Student Applications Error:', error);
    return NextResponse.json({ error: 'Server error retrieving applications.' }, { status: 500 });
  }
}
