import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { internship: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    // Security check: Only the company that posted the internship (or Admin) can update applicant status
    if (
      authUser.role !== 'admin' &&
      application.internship.companyId !== authUser.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to manage this candidate.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !['pending', 'shortlisted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid application status. Must be "shortlisted" or "rejected".' },
        { status: 400 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: status }, // Map to lowercase enum ApplicationStatus
    });

    return NextResponse.json({
      message: `Candidate status updated to ${status} successfully!`,
      application: {
        id: updated.id,
        status: updated.status,
        aiMatchScore: updated.aiMatchScore,
      },
    });
  } catch (error) {
    console.error('Update Application Error:', error);
    return NextResponse.json({ error: 'Server error updating candidate status.' }, { status: 500 });
  }
}
