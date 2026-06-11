import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';
import { uploadResume } from '@/lib/cloudinary';
import { calculateMatchScore } from '@/lib/matcher';

export async function POST(req, { params }) {
  try {
    const { id: internshipId } = await params;
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized. Only students can apply for internships.' },
        { status: 403 }
      );
    }

    // Check if internship exists and is approved
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Internship posting not found.' }, { status: 404 });
    }

    if (internship.status !== 'approved') {
      return NextResponse.json(
        { error: 'This internship is not accepting applications at this time.' },
        { status: 400 }
      );
    }

    // Check if student has already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        internshipId_studentId: {
          internshipId,
          studentId: authUser.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this internship.' },
        { status: 400 }
      );
    }

    // Retrieve student profile for matching and existing resume
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: authUser.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: 'Student profile not found. Please create a profile first.' },
        { status: 400 }
      );
    }

    // Parse form-data
    const formData = await req.formData();
    const file = formData.get('resume');
    const useExisting = formData.get('useExisting') === 'true';

    let resumeUrl = '';

    if (useExisting) {
      if (!studentProfile.resumeUrl) {
        return NextResponse.json(
          { error: 'No resume found on your profile. Please upload a file.' },
          { status: 400 }
        );
      }
      resumeUrl = studentProfile.resumeUrl;
    } else {
      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { error: 'Please upload a PDF/Word resume file or choose to use your profile resume.' },
          { status: 400 }
        );
      }

      // Convert file stream to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload file
      const uploadResult = await uploadResume(buffer, file.name);
      resumeUrl = uploadResult.url;

      // Update student profile with new resume if they don't have one yet
      if (!studentProfile.resumeUrl) {
        await prisma.studentProfile.update({
          where: { id: studentProfile.id },
          data: {
            resumeUrl: uploadResult.url,
            resumePublicId: uploadResult.publicId,
          },
        });
      }
    }

    // Calculate match score
    const matchScore = calculateMatchScore(
      studentProfile.skills,
      studentProfile.bio,
      internship.skillsRequired,
      internship.description
    );

    // Create the Application
    const application = await prisma.application.create({
      data: {
        internshipId,
        studentId: authUser.id,
        resumeUrl,
        status: 'pending', // Map to lowercase enum ApplicationStatus
        aiMatchScore: matchScore,
      },
    });

    return NextResponse.json(
      {
        message: 'Application submitted successfully!',
        application: {
          id: application.id,
          status: application.status,
          aiMatchScore: application.aiMatchScore,
          resumeUrl: application.resumeUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Apply API Error:', error);
    return NextResponse.json({ error: 'Server error processing your application.' }, { status: 500 });
  }
}
