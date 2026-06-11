import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, role, companyName } = body;

    // Validate request
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Please fill in all required fields (name, email, password, role).' },
        { status: 400 }
      );
    }

    if (!['student', 'company', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid user role selected.' },
        { status: 400 }
      );
    }

    if (role === 'company' && !companyName) {
      return NextResponse.json(
        { error: 'Company registration requires a company name.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the User with nested profile
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role, // Map to enum ['student', 'company', 'admin']
        studentProfile: role === 'student' ? {
          create: {
            skills: [],
            bio: '',
            resumeUrl: '',
            resumePublicId: '',
          }
        } : undefined,
        companyProfile: role === 'company' ? {
          create: {
            companyName,
            website: '',
            description: '',
            logoUrl: '',
            logoPublicId: '',
            location: '',
            isVerified: false,
          }
        } : undefined,
      },
    });

    if (role === 'company') {
      await prisma.$executeRawUnsafe(
        `INSERT INTO companies (company_name, email, password, verification_status) VALUES ($1, $2, $3, $4)`,
        companyName,
        email.toLowerCase().trim(),
        hashedPassword,
        'pending'
      );
    }

    return NextResponse.json(
      {
        message: 'Registration successful!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred during registration.' },
      { status: 500 }
    );
  }
}
