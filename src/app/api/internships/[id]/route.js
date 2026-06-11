import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

// GET internship details by ID
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const internship = await prisma.internship.findUnique({
      where: { id },
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
    });

    if (!internship) {
      return NextResponse.json({ error: 'Internship not found.' }, { status: 404 });
    }

    const formattedInternship = {
      _id: internship.id,
      title: internship.title,
      description: internship.description,
      skillsRequired: internship.skillsRequired,
      stipend: internship.stipend,
      duration: internship.duration,
      location: internship.location,
      status: internship.status,
      createdAt: internship.createdAt,
      company: {
        id: internship.company.id,
        name: internship.company.name,
        email: internship.company.email,
        companyName: internship.company.companyProfile?.companyName || internship.company.name,
        logoUrl: internship.company.companyProfile?.logoUrl || '',
        location: internship.company.companyProfile?.location || '',
        website: internship.company.companyProfile?.website || '',
        description: internship.company.companyProfile?.description || '',
      },
    };

    return NextResponse.json(formattedInternship);
  } catch (error) {
    console.error('GET Internship Detail Error:', error);
    return NextResponse.json({ error: 'Server error retrieving internship details.' }, { status: 500 });
  }
}

// PUT update internship (Admin approvals, or Company edits)
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const internship = await prisma.internship.findUnique({
      where: { id },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Internship not found.' }, { status: 404 });
    }

    const body = await req.json();

    // Case 1: Admin moderation (Approving or Rejecting)
    if (authUser.role === 'admin') {
      const { status } = body;
      if (status && ['approved', 'rejected', 'pending'].includes(status)) {
        const updated = await prisma.internship.update({
          where: { id },
          data: { status: status }, // Map to lowercase enum status
        });
        return NextResponse.json({
          message: `Internship status updated to ${status} successfully.`,
          internship: { _id: updated.id, ...updated },
        });
      }
      return NextResponse.json({ error: 'Invalid moderation status.' }, { status: 400 });
    }

    // Case 2: Company updating their own post
    if (authUser.role === 'company') {
      if (internship.companyId !== authUser.id) {
        return NextResponse.json({ error: 'Forbidden. You do not own this posting.' }, { status: 403 });
      }

      const { title, description, skillsRequired, stipend, duration, location } = body;

      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (stipend) updateData.stipend = stipend;
      if (duration) updateData.duration = duration;
      if (location) updateData.location = location;

      if (skillsRequired !== undefined) {
        updateData.skillsRequired = Array.isArray(skillsRequired)
          ? skillsRequired
          : skillsRequired.split(',').map(s => s.trim()).filter(Boolean);
      }

      // If edited by company, reset status to pending for admin re-approval
      updateData.status = 'pending';

      const updated = await prisma.internship.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        message: 'Internship updated successfully and submitted for admin review.',
        internship: { _id: updated.id, ...updated },
      });
    }

    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  } catch (error) {
    console.error('PUT Internship Error:', error);
    return NextResponse.json({ error: 'Server error updating internship.' }, { status: 500 });
  }
}

// DELETE internship
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const internship = await prisma.internship.findUnique({
      where: { id },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Internship not found.' }, { status: 404 });
    }

    // Allow Admin or the Company that posted it
    if (authUser.role !== 'admin' && internship.companyId !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden. Access denied.' }, { status: 403 });
    }

    await prisma.internship.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Internship posting deleted successfully.' });
  } catch (error) {
    console.error('DELETE Internship Error:', error);
    return NextResponse.json({ error: 'Server error deleting internship.' }, { status: 500 });
  }
}
