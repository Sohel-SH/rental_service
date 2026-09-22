import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to format payment objects
function formatPayment(payment: any) {
  if (!payment) return null;
  return {
    ...payment,
    _id: payment.id,
    property: payment.property ? {
      ...payment.property,
      _id: payment.property.id,
      images: payment.property.images ? payment.property.images.split(',') : [],
    } : null,
    user: payment.user ? {
      ...payment.user,
      _id: payment.user.id,
    } : null,
  };
}

// GET: Fetch payments and financial summary based on user role
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

    let rawPayments: any[] = [];
    let stats = {
      totalCollected: 0,
      totalPending: 0,
      totalDepositsHeld: 0,
      totalBrokerageEarned: 0,
      overdueCount: 0,
    };

    if (payload.role === 'admin') {
      // Admins see all platform cashflow
      rawPayments = await prisma.payment.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              images: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          lease: {
            select: {
              id: true,
              durationMonths: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'owner') {
      // Owners see payments for their properties
      rawPayments = await prisma.payment.findMany({
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          lease: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'tenant') {
      // Tenants see their own invoices and payment history
      rawPayments = await prisma.payment.findMany({
        where: {
          userId: payload.id,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              images: true,
              owner: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          lease: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Calculate dynamic financial metrics
    rawPayments.forEach((p) => {
      if (p.status === 'PAID') {
        if (p.type === 'BROKERAGE') {
          stats.totalBrokerageEarned += p.amount;
        } else if (p.type === 'SECURITY_DEPOSIT') {
          stats.totalDepositsHeld += p.amount;
          stats.totalCollected += p.amount;
        } else {
          stats.totalCollected += p.amount;
        }
      } else if (p.status === 'PENDING') {
        stats.totalPending += p.amount;
      } else if (p.status === 'OVERDUE') {
        stats.totalPending += p.amount;
        stats.overdueCount += 1;
      }
    });

    const payments = rawPayments.map(formatPayment);
    return NextResponse.json({ payments, stats });
  } catch (error: any) {
    console.error('Fetch payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new invoice or payment record
export async function POST(request: Request) {
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
    const {
      propertyId,
      leaseId,
      userId: targetUserId,
      title,
      amount,
      type = 'RENT',
      status = 'PENDING',
      paymentMethod = 'UPI',
      dueDate,
      notes,
    } = body;

    if (!propertyId || !amount) {
      return NextResponse.json(
        { error: 'Property and Amount are required.' },
        { status: 400 }
      );
    }

    // Determine paying user
    const finalUserId = targetUserId || payload.id;
    const isPaid = status === 'PAID';
    const now = new Date();
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const transactionId = isPaid ? `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}` : null;

    const newPayment = await prisma.payment.create({
      data: {
        propertyId,
        leaseId: leaseId || undefined,
        userId: finalUserId,
        title: title || `${type.replace('_', ' ')} Invoice`,
        amount: Number(amount),
        type,
        status,
        paymentMethod,
        transactionId,
        receiptNumber: isPaid ? receiptNumber : null,
        dueDate: dueDate ? new Date(dueDate) : new Date(now.getFullYear(), now.getMonth(), 5),
        paidAt: isPaid ? now : null,
        notes,
      },
      include: {
        property: true,
        user: true,
      },
    });

    return NextResponse.json(
      { message: 'Payment record created successfully.', payment: formatPayment(newPayment) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT: Update payment status (Pay invoice, record transaction, approve refund)
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
    const { paymentId, status, paymentMethod, notes } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Payment ID and status are required.' },
        { status: 400 }
      );
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
    }

    const isPaid = status === 'PAID';
    const now = new Date();
    const receiptNumber = existingPayment.receiptNumber || `RCP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const transactionId = existingPayment.transactionId || (isPaid ? `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}` : null);

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paymentMethod: paymentMethod || existingPayment.paymentMethod,
        transactionId,
        receiptNumber: isPaid ? receiptNumber : existingPayment.receiptNumber,
        paidAt: isPaid ? (existingPayment.paidAt || now) : existingPayment.paidAt,
        notes: notes !== undefined ? notes : existingPayment.notes,
      },
      include: {
        property: true,
        user: true,
      },
    });

    return NextResponse.json(
      { message: `Payment updated to ${status}.`, payment: formatPayment(updatedPayment) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment: ' + error.message },
      { status: 500 }
    );
  }
}
