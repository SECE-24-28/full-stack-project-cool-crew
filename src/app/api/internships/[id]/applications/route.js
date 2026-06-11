import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function GET(req, { params }) {
  try {
    const { id: internshipId } = await params;
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Internship posting not found.' }, { status: 404 });
    }

    // Verify permission: Only the posting company or Admin can view applications
    if (authUser.role !== 'admin' && internship.companyId !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden. Access denied.' }, { status: 403 });
    }

    // Retrieve applications and populate student user credentials & profile details (with education)
    const applications = await prisma.application.findMany({
      where: { internshipId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              include: {
                education: true,
              },
            },
          },
        },
      },
      orderBy: [
        { aiMatchScore: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const formattedApplications = applications.map(app => {
      const profile = app.student.studentProfile;
      return {
        _id: app.id,
        status: app.status,
        resumeUrl: app.resumeUrl,
        aiMatchScore: app.aiMatchScore,
        appliedAt: app.appliedAt,
        student: {
          id: app.student.id,
          name: app.student.name,
          email: app.student.email,
          skills: profile?.skills || [],
          education: profile?.education || [],
          bio: profile?.bio || '',
        },
      };
    });

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error('GET Applicants API Error:', error);
    return NextResponse.json({ error: 'Server error retrieving applicants.' }, { status: 500 });
  }
}
