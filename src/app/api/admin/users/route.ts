import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Administrators only.' },
        { status: 403 }
      );
    }

    // Fetch all users, excluding passwords
    const rawUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Map output to match frontend expectations
    const users = rawUsers.map((user: any) => ({
      ...user,
      _id: user.id,
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users: ' + error.message },
      { status: 500 }
    );
  }
}
