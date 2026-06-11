import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

// GET all approved internships (with optional query parameters)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const duration = searchParams.get('duration') || '';

    // Build Prisma query object
    const query = { status: 'approved' };

    if (search) {
      query.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { skillsRequired: { has: search } }, // Prisma PostgreSQL array search
      ];
    }

    if (location) {
      query.location = { contains: location, mode: 'insensitive' };
    }

    if (duration) {
      query.duration = { contains: duration, mode: 'insensitive' };
    }

    // Retrieve internships, joining company user and company profile tables
    const internships = await prisma.internship.findMany({
      where: query,
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

    // Format output to match the frontend expectations
    const formattedInternships = internships.map(i => ({
      _id: i.id,
      title: i.title,
      description: i.description,
      skillsRequired: i.skillsRequired,
      stipend: i.stipend,
      duration: i.duration,
      location: i.location,
      status: i.status,
      createdAt: i.createdAt,
      company: {
        id: i.company.id,
        name: i.company.name,
        email: i.company.email,
        companyName: i.company.companyProfile?.companyName || i.company.name,
        logoUrl: i.company.companyProfile?.logoUrl || '',
        location: i.company.companyProfile?.location || '',
        website: i.company.companyProfile?.website || '',
        description: i.company.companyProfile?.description || '',
      },
    }));

    return NextResponse.json(formattedInternships);
  } catch (error) {
    console.error('GET Internships API Error:', error);
    return NextResponse.json({ error: 'Server error retrieving internships.' }, { status: 500 });
  }
}

// POST a new internship posting (Company only)
export async function POST(req) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== 'company') {
      return NextResponse.json(
        { error: 'Unauthorized. Only registered companies can post internships.' },
        { status: 403 }
      );
    }

    // Verify company status in companies table
    const companies = await prisma.$queryRawUnsafe(
      `SELECT verification_status FROM companies WHERE email = $1`,
      authUser.email
    );
    const companyStatus = companies[0]?.verification_status;

    if (companyStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Your company profile must be approved and OTP verified before posting opportunities.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, skillsRequired, stipend, duration, location } = body;

    // Validate request
    if (!title || !description || !stipend || !duration || !location) {
      return NextResponse.json(
        { error: 'Please enter all required fields.' },
        { status: 400 }
      );
    }

    // Convert comma-separated string of skills to array if necessary
    let skillsArray = [];
    if (Array.isArray(skillsRequired)) {
      skillsArray = skillsRequired;
    } else if (typeof skillsRequired === 'string') {
      skillsArray = skillsRequired.split(',').map(s => s.trim()).filter(Boolean);
    }

    const internship = await prisma.internship.create({
      data: {
        companyId: authUser.id,
        title,
        description,
        skillsRequired: skillsArray,
        stipend,
        duration,
        location,
        status: 'pending', // Set pending until admin reviews
      },
    });

    return NextResponse.json(
      {
        message: 'Internship posting submitted successfully! It is pending admin approval.',
        internship: {
          _id: internship.id,
          ...internship
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Internship API Error:', error);
    return NextResponse.json({ error: 'Server error creating internship posting.' }, { status: 500 });
  }
}
