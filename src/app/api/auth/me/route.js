import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

// GET current authenticated user profile
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        studentProfile: {
          include: { education: true }
        },
        companyProfile: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Exclude password from response
    const { password, ...userWithoutPassword } = user;

    let profile = null;
    let companyVerificationStatus = null;
    if (user.role === 'student') {
      profile = user.studentProfile;
    } else if (user.role === 'company') {
      profile = user.companyProfile;
      // Fetch verification_status from companies table
      const companies = await prisma.$queryRawUnsafe(
        `SELECT verification_status FROM companies WHERE email = $1`,
        user.email
      );
      if (companies && companies.length > 0) {
        companyVerificationStatus = companies[0].verification_status;
      }
    }

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        companyVerificationStatus,
      },
      profile,
    });
  } catch (error) {
    console.error('GET Profile Error:', error);
    return NextResponse.json({ error: 'Server error retrieving profile.' }, { status: 500 });
  }
}

// PUT update profile info
export async function PUT(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, ...profileData } = body;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Update name on User table if provided
    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    let profile = null;

    if (user.role === 'student') {
      // Find or create student profile
      profile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        profile = await prisma.studentProfile.create({
          data: { userId: user.id },
        });
      }

      // Prepare fields to update
      const updateData = {};
      if (profileData.skills !== undefined) updateData.skills = profileData.skills;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;
      if (profileData.resumeUrl !== undefined) updateData.resumeUrl = profileData.resumeUrl;
      if (profileData.resumePublicId !== undefined) updateData.resumePublicId = profileData.resumePublicId;

      profile = await prisma.studentProfile.update({
        where: { id: profile.id },
        data: updateData,
      });

      // Update Education history (Relational replacement)
      if (profileData.education !== undefined) {
        // Delete old education
        await prisma.education.deleteMany({
          where: { studentProfileId: profile.id },
        });

        // Insert new education
        if (profileData.education.length > 0) {
          await prisma.education.createMany({
            data: profileData.education.map(edu => ({
              studentProfileId: profile.id,
              institution: edu.institution,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy || '',
              startYear: edu.startYear || '',
              endYear: edu.endYear || '',
            })),
          });
        }
      }

      // Re-fetch profile with education
      profile = await prisma.studentProfile.findUnique({
        where: { id: profile.id },
        include: { education: true }
      });

    } else if (user.role === 'company') {
      profile = await prisma.companyProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        profile = await prisma.companyProfile.create({
          data: { userId: user.id, companyName: name || 'My Company' },
        });
      }

      const updateData = {};
      if (profileData.companyName !== undefined) updateData.companyName = profileData.companyName;
      if (profileData.website !== undefined) updateData.website = profileData.website;
      if (profileData.description !== undefined) updateData.description = profileData.description;
      if (profileData.logoUrl !== undefined) updateData.logoUrl = profileData.logoUrl;
      if (profileData.logoPublicId !== undefined) updateData.logoPublicId = profileData.logoPublicId;
      if (profileData.location !== undefined) updateData.location = profileData.location;

      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: updateData,
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({
      message: 'Profile updated successfully!',
      user: updatedUser,
      profile,
    });
  } catch (error) {
    console.error('PUT Profile Error:', error);
    return NextResponse.json({ error: 'Server error updating profile.' }, { status: 500 });
  }
}
