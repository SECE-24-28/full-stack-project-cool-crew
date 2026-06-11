import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';
import { uploadResume } from '@/lib/cloudinary';

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized. Only students can upload resumes.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('resume');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Convert file stream to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Call Cloudinary / Local upload utility
    const uploadResult = await uploadResume(buffer, file.name);

    // Find and update student profile
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: authUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
    }

    const updated = await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        resumeUrl: uploadResult.url,
        resumePublicId: uploadResult.publicId,
      },
    });

    return NextResponse.json({
      message: 'Resume uploaded successfully!',
      url: updated.resumeUrl,
      publicId: updated.resumePublicId,
    });
  } catch (error) {
    console.error('Upload API Route Error:', error);
    return NextResponse.json({ error: 'Server error uploading file.' }, { status: 500 });
  }
}
