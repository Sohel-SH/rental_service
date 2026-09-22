import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { sendLeadNotificationToAdmin } from '@/lib/notifications';

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
      // Admins see all leads with both Property and Owner contact details
      rawLeads = await prisma.lead.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              images: true,
              ownerId: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
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
    let { propertyId, name, email, phone, message } = body;

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Missing required field details for lead submission.' },
        { status: 400 }
      );
    }

    // If propertyId not supplied (e.g. general contact enquiry), find default property
    if (!propertyId) {
      const defaultProp = await prisma.property.findFirst();
      if (defaultProp) {
        propertyId = defaultProp.id;
      }
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: 'No active property found to associate enquiry with.' },
        { status: 400 }
      );
    }

    // Verify property exists and fetch owner details for admin alert
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
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

    // Build Admin WhatsApp Notification payload
    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || '917218661327';
    const cleanAdminPhone = adminPhone.replace(/\D/g, '');

    const adminNotificationText =
      `🚨 *NEW PROPERTY LEAD ALERT - S.R RENTALS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏠 *Property:* ${property.title}\n` +
      `💰 *Rent:* ₹${property.price.toLocaleString('en-IN')}/month\n` +
      `📍 *Location:* ${property.location}\n\n` +
      `👤 *Interested Client:* ${name.trim()}\n` +
      `📞 *Client Phone:* ${phone.trim()}\n` +
      `✉️ *Client Email:* ${email.trim()}\n` +
      `📝 *Note:* "${message.trim()}"\n\n` +
      `👤 *Property Owner:* ${property.owner?.name || 'Registered Landlord'}\n` +
      `📞 *Owner Phone:* ${property.owner?.phone || 'Not provided'}\n` +
      `🕒 *Timestamp:* ${new Date().toLocaleString('en-IN')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_S.R Rental Services Instant Lead Notification_`;

    const adminWhatsAppUrl = `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(adminNotificationText)}`;

    // Dispatch background real-time phone notification (Telegram, Webhook, CallMeBot)
    sendLeadNotificationToAdmin({
      leadId: newLead.id,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      propertyTitle: property.title,
      propertyPrice: property.price,
      propertyLocation: property.location,
      ownerName: property.owner?.name,
      ownerPhone: property.owner?.phone || undefined,
      message,
    }).catch((err: any) => {
      console.error('Async phone notification error:', err);
    });

    console.log(`[Lead Notification] New lead #${newLead.id} generated for property "${property.title}" by client ${name} (${phone})`);

    return NextResponse.json(
      {
        message: 'Enquiry submitted successfully.',
        lead: { ...newLead, _id: newLead.id },
        adminWhatsAppUrl,
        adminNotificationText,
      },
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
    const { leadId, status, assignedAgent } = body;

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

    const updateData: any = { status };
    if (assignedAgent !== undefined) {
      updateData.assignedAgent = assignedAgent;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
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
