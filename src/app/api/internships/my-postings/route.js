import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

// GET all internship postings (approved, pending, rejected) created by the logged-in company
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'company') {
      return NextResponse.json(
        { error: 'Unauthorized. Company access required.' },
        { status: 403 }
      );
    }

    // Retrieve all postings by this company
    const internships = await prisma.internship.findMany({
      where: { companyId: authUser.id },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch applicant count for each posting in parallel
    const formattedInternships = await Promise.all(
      internships.map(async (internship) => {
        const applicantCount = await prisma.application.count({
          where: { internshipId: internship.id },
        });
        return {
          _id: internship.id,
          title: internship.title,
          description: internship.description,
          skillsRequired: internship.skillsRequired,
          stipend: internship.stipend,
          duration: internship.duration,
          location: internship.location,
          status: internship.status,
          createdAt: internship.createdAt,
          applicantCount,
        };
      })
    );

    return NextResponse.json(formattedInternships);
  } catch (error) {
    console.error('GET Company Postings Error:', error);
    return NextResponse.json({ error: 'Server error retrieving your postings.' }, { status: 500 });
  }
}
