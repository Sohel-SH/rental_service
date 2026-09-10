import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to format lead objects for frontend Mongoose compatibility
function formatLead(lead: any) {
  if (!lead) return null;
  return {
    ...lead,
    _id: lead.id,
    propertyId: lead.property ? {
      ...lead.property,
      _id: lead.property.id,
      images: lead.property.images ? lead.property.images.split(',') : [],
    } : null,
  };
}

// GET: Fetch leads based on user role
export async function GET(request: Request) {
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

    let rawLeads: any[] = [];

    if (payload.role === 'admin') {
      // Admins see all leads
      rawLeads = await prisma.lead.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'owner') {
      // Landlords see leads for their own properties
      rawLeads = await prisma.lead.findMany({
        where: {
          property: {
            ownerId: payload.id,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'tenant') {
      // Tenants see enquiries they have made
      rawLeads = await prisma.lead.findMany({
        where: {
          tenantId: payload.id,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const leads = rawLeads.map(formatLead);
    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error('Fetch leads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enquiries: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new lead/enquiry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, name, email, phone, message } = body;

    if (!propertyId || !name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Missing required field details for lead submission.' },
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

    // Check if user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let tenantId = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.role === 'tenant') {
        tenantId = payload.id;
      }
    }

    // Create the lead
    const newLead = await prisma.lead.create({
      data: {
        propertyId,
        tenantId: tenantId || undefined,
        name,
        email,
        phone,
        message,
        status: 'new',
      },
    });

    return NextResponse.json(
      { message: 'Enquiry submitted successfully.', lead: { ...newLead, _id: newLead.id } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Submit lead error:', error);
    return NextResponse.json(
      { error: 'Failed to submit enquiry: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT: Update lead status (called by landlord or admin)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'owner' && payload.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden. Landlords and Admins only.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { leadId, status } = body;

    if (!leadId || !status) {
      return NextResponse.json(
        { error: 'Lead ID and new status are required.' },
        { status: 400 }
      );
    }

    // If owner, verify the lead belongs to their property
    if (payload.role === 'owner') {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { property: true },
      });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }
      
      if (lead.property.ownerId !== payload.id) {
        return NextResponse.json(
          { error: 'Forbidden. You do not own this property.' },
          { status: 403 }
        );
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    return NextResponse.json({
      message: 'Enquiry status updated successfully.',
      lead: { ...updatedLead, _id: updatedLead.id },
    });
  } catch (error: any) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: 'Failed to update enquiry: ' + error.message },
      { status: 500 }
    );
  }
}
