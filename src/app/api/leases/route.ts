import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { sendLeadNotificationToAdmin } from '@/lib/notifications';
import bcrypt from 'bcryptjs';

// Helper to format lease objects
function formatLease(lease: any) {
  if (!lease) return null;
  return {
    ...lease,
    _id: lease.id,
    property: lease.property ? {
      ...lease.property,
      _id: lease.property.id,
      images: lease.property.images ? lease.property.images.split(',') : [],
    } : null,
    tenant: lease.tenant ? {
      ...lease.tenant,
      _id: lease.tenant.id,
    } : null,
    owner: lease.owner ? {
      ...lease.owner,
      _id: lease.owner.id,
    } : null,
  };
}

// GET: Fetch leases based on role
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

    let rawLeases: any[] = [];

    if (payload.role === 'admin') {
      rawLeases = await prisma.lease.findMany({
        include: {
          property: true,
          tenant: {
            select: { id: true, name: true, email: true, phone: true },
          },
          owner: {
            select: { id: true, name: true, email: true, phone: true },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'owner') {
      rawLeases = await prisma.lease.findMany({
        where: { ownerId: payload.id },
        include: {
          property: true,
          tenant: {
            select: { id: true, name: true, email: true, phone: true },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'tenant') {
      rawLeases = await prisma.lease.findMany({
        where: { tenantId: payload.id },
        include: {
          property: true,
          owner: {
            select: { id: true, name: true, email: true, phone: true },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const leases = rawLeases.map(formatLease);
    return NextResponse.json({ leases });
  } catch (error: any) {
    console.error('Fetch leases error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leases: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new lease / tenancy agreement
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'owner')) {
      return NextResponse.json({ error: 'Only admins and owners can create lease agreements.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      propertyId,
      tenantId,
      tenantName,
      tenantPhone,
      tenantEmail,
      startDate,
      endDate,
      durationMonths = 11,
      monthlyRent,
      securityDeposit,
    } = body;

    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const email = (tenantEmail || (tenantPhone ? `${tenantPhone.replace(/\D/g, '')}@srrentals.com` : `tenant_${Date.now()}@srrentals.com`)).trim().toLowerCase();
      let foundTenant = await prisma.user.findUnique({
        where: { email },
      });

      if (!foundTenant) {
        // Auto-provision tenant account so ANY person can be registered as tenant
        const defaultPassword = await bcrypt.hash('password123', 10);
        foundTenant = await prisma.user.create({
          data: {
            name: tenantName || (email.split('@')[0]),
            email: email,
            password: defaultPassword,
            phone: tenantPhone || '',
            role: 'tenant',
          },
        });
      }
      targetTenantId = foundTenant.id;
    }

    if (!propertyId || !targetTenantId || !monthlyRent) {
      return NextResponse.json(
        { error: 'Property, Tenant, and Monthly Rent are required.' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const calculatedEnd = new Date(start);
    calculatedEnd.setMonth(calculatedEnd.getMonth() + Number(durationMonths));
    const end = endDate ? new Date(endDate) : calculatedEnd;

    // Create Lease
    const newLease = await prisma.lease.create({
      data: {
        propertyId,
        tenantId: targetTenantId,
        ownerId: property.ownerId,
        startDate: start,
        endDate: end,
        durationMonths: Number(durationMonths),
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit || monthlyRent * 2),
        status: 'ACTIVE',
      },
    });

    // Update Property to Occupied
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        occupancyStatus: 'occupied',
        isAvailable: false,
        vacantFromDate: null,
      },
    });

    // Create Initial Security Deposit Invoice
    if (securityDeposit && Number(securityDeposit) > 0) {
      await prisma.payment.create({
        data: {
          leaseId: newLease.id,
          propertyId,
          userId: targetTenantId,
          title: `Security Deposit for ${property.title}`,
          amount: Number(securityDeposit),
          type: 'SECURITY_DEPOSIT',
          status: 'PAID',
          paidAt: new Date(),
          receiptNumber: `DEP-${Date.now().toString().slice(-6)}`,
          transactionId: `TXN-DEP-${Date.now().toString().slice(-4)}`,
        },
      });
    }

    // Create First Month Rent Invoice
    await prisma.payment.create({
      data: {
        leaseId: newLease.id,
        propertyId,
        userId: targetTenantId,
        title: `1st Month Rent (${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()})`,
        amount: Number(monthlyRent),
        type: 'RENT',
        status: 'PAID',
        paidAt: new Date(),
        receiptNumber: `RENT-${Date.now().toString().slice(-6)}`,
        transactionId: `TXN-RENT-${Date.now().toString().slice(-4)}`,
      },
    });

    return NextResponse.json(
      { message: 'Lease agreement created successfully.', lease: formatLease(newLease) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create lease error:', error);
    return NextResponse.json(
      { error: 'Failed to create lease: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT: Submit Notice to Vacate / Terminate Lease
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
    const { leaseId, action = 'submit_notice', vacatingDate, noticeReason } = body;

    if (!leaseId) {
      return NextResponse.json({ error: 'Lease ID is required.' }, { status: 400 });
    }

    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: true,
        tenant: true,
        owner: true,
      },
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found.' }, { status: 404 });
    }

    if (action === 'submit_notice') {
      const vDate = vacatingDate ? new Date(vacatingDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const updatedLease = await prisma.lease.update({
        where: { id: leaseId },
        data: {
          status: 'NOTICE_PERIOD',
          noticeDate: new Date(),
          vacatingDate: vDate,
          noticeReason: noticeReason || 'Notice submitted via Tenant Portal.',
        },
        include: { property: true, tenant: true, owner: true },
      });

      // Update property to "vacating_soon" with vacantFromDate for zero-vacancy pre-booking!
      await prisma.property.update({
        where: { id: lease.propertyId },
        data: {
          occupancyStatus: 'vacating_soon',
          isAvailable: true, // Make visible for advance booking
          vacantFromDate: vDate,
        },
      });

      // Dispatch alert to Admin Hotline
      sendLeadNotificationToAdmin({
        leadId: `NOTICE-${lease.id.slice(0, 6)}`,
        clientName: lease.tenant.name,
        clientPhone: lease.tenant.phone || 'N/A',
        clientEmail: lease.tenant.email,
        propertyTitle: lease.property.title,
        propertyPrice: lease.property.price,
        propertyLocation: lease.property.location,
        ownerName: lease.owner.name,
        ownerPhone: lease.owner.phone || undefined,
        message: `📢 NOTICE TO VACATE SUBMITTED: Tenant ${lease.tenant.name} will vacate on ${vDate.toLocaleDateString('en-IN')}. Property is now opened for advance pre-booking.`,
      }).catch((err: any) => console.error('Notice alert error:', err));

      return NextResponse.json({
        message: `Notice to vacate submitted for ${vDate.toLocaleDateString('en-IN')}. Property is now listed for advance booking.`,
        lease: formatLease(updatedLease),
      });
    } else if (action === 'terminate_or_complete') {
      const updatedLease = await prisma.lease.update({
        where: { id: leaseId },
        data: {
          status: 'COMPLETED',
        },
        include: { property: true, tenant: true, owner: true },
      });

      // Make property fully available again
      await prisma.property.update({
        where: { id: lease.propertyId },
        data: {
          occupancyStatus: 'available',
          isAvailable: true,
          vacantFromDate: null,
        },
      });

      return NextResponse.json({
        message: 'Lease concluded and property marked as available.',
        lease: formatLease(updatedLease),
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Update lease error:', error);
    return NextResponse.json(
      { error: 'Failed to update lease: ' + error.message },
      { status: 500 }
    );
  }
}
