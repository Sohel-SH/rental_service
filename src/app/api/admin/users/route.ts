import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const roleFilter = searchParams.get('role'); // e.g. 'tenant'
    const isOwner = payload.role === 'owner';

    // If owner is querying without search, fetch their previous / current tenants first as suggestions!
    let previousTenantIds: string[] = [];
    if (isOwner && !search) {
      const ownerLeases = await prisma.lease.findMany({
        where: { ownerId: payload.id },
        select: { tenantId: true },
      });
      previousTenantIds = Array.from(new Set(ownerLeases.map((l) => l.tenantId).filter(Boolean)));
    }

    const whereClause: any = {};

    if (roleFilter && roleFilter !== 'tenant' && roleFilter !== 'tenants') {
      whereClause.role = roleFilter;
    } else if (roleFilter === 'tenant' || roleFilter === 'tenants' || isOwner) {
      whereClause.role = { notIn: ['admin', 'owner', 'telecaller'] };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    } else if (isOwner) {
      if (previousTenantIds.length > 0) {
        whereClause.id = { in: previousTenantIds };
      } else {
        // Return empty list if owner has no previous tenants and hasn't searched
        return NextResponse.json({ users: [] });
      }
    }

    // Fetch matching users, excluding passwords
    const rawUsers = await prisma.user.findMany({
      where: whereClause,
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
      take: search ? 25 : 50,
    });

    // Map output to match frontend expectations
    const users = rawUsers.map((user: any) => ({
      ...user,
      _id: user.id,
      isPreviousTenant: isOwner ? previousTenantIds.includes(user.id) : false,
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

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, email, phone, password, role = 'telecaller' } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists.' },
        { status: 400 }
      );
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone: phone || '',
        password: hashedPassword,
        role: role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: 'User created successfully.', user: { ...newUser, _id: newUser.id } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and new role are required.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'User role updated successfully.',
      user: { ...updatedUser, _id: updatedUser.id },
    });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: 'Failed to update user role: ' + error.message },
      { status: 500 }
    );
  }
}
