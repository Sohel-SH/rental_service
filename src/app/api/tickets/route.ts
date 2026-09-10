import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to format ticket objects for frontend compatibility
function formatTicket(ticket: any) {
  if (!ticket) return null;
  return {
    ...ticket,
    _id: ticket.id,
    propertyId: ticket.property ? {
      ...ticket.property,
      _id: ticket.property.id,
      images: ticket.property.images ? ticket.property.images.split(',') : [],
    } : null,
    tenantId: ticket.tenant ? {
      ...ticket.tenant,
      _id: ticket.tenant.id,
    } : null,
  };
}

// GET: Fetch maintenance tickets based on user role
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    }

    let rawTickets: any[] = [];

    if (payload.role === 'admin') {
      // Admins see all tickets
      rawTickets = await prisma.ticket.findMany({
        include: {
          tenant: {
            select: { id: true, name: true, email: true, phone: true },
          },
          property: {
            select: { id: true, title: true, location: true, price: true, images: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'owner') {
      // Landlords see tickets for their own properties
      rawTickets = await prisma.ticket.findMany({
        where: {
          property: {
            ownerId: payload.id,
          },
        },
        include: {
          tenant: {
            select: { id: true, name: true, email: true, phone: true },
          },
          property: {
            select: { id: true, title: true, location: true, price: true, images: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'tenant') {
      // Tenants see tickets they created
      rawTickets = await prisma.ticket.findMany({
        where: {
          tenantId: payload.id,
        },
        include: {
          property: {
            select: { id: true, title: true, location: true, price: true, images: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const tickets = rawTickets.map(formatTicket);
    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new maintenance ticket (Tenants only)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'tenant') {
      return NextResponse.json(
        { error: 'Forbidden. Tenants only can raise tickets.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, title, description, priority } = body;

    if (!propertyId || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required ticket details.' },
        { status: 400 }
      );
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    const newTicket = await prisma.ticket.create({
      data: {
        tenantId: payload.id,
        propertyId,
        title,
        description,
        priority: priority || 'medium',
        status: 'open',
      },
    });

    return NextResponse.json(
      { message: 'Ticket created successfully.', ticket: { ...newTicket, _id: newTicket.id } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT: Update ticket status (Landlords, Admins, or Tenants closing their own)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: 'Ticket ID and new status are required.' },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    // Permissions check
    if (payload.role === 'tenant') {
      if (ticket.tenantId !== payload.id) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    } else if (payload.role === 'owner') {
      const property = await prisma.property.findUnique({
        where: { id: ticket.propertyId },
      });
      if (!property || property.ownerId !== payload.id) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
    });

    return NextResponse.json({
      message: 'Ticket status updated successfully.',
      ticket: { ...updatedTicket, _id: updatedTicket.id },
    });
  } catch (error: any) {
    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket: ' + error.message },
      { status: 500 }
    );
  }
}
