import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to format deal objects
function formatDeal(deal: any) {
  if (!deal) return null;
  return {
    ...deal,
    _id: deal.id,
    property: deal.property ? {
      ...deal.property,
      _id: deal.property.id,
      images: deal.property.images ? deal.property.images.split(',') : [],
    } : null,
    buyer: deal.buyer ? {
      ...deal.buyer,
      _id: deal.buyer.id,
    } : null,
    seller: deal.seller ? {
      ...deal.seller,
      _id: deal.seller.id,
    } : null,
  };
}

// GET: Fetch closed deals & sales records
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

    let rawDeals: any[] = [];

    if (payload.role === 'admin') {
      rawDeals = await prisma.deal.findMany({
        include: {
          property: true,
          buyer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          seller: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { closingDate: 'desc' },
      });
    } else if (payload.role === 'owner') {
      rawDeals = await prisma.deal.findMany({
        where: { sellerId: payload.id },
        include: {
          property: true,
          buyer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { closingDate: 'desc' },
      });
    } else if (payload.role === 'tenant') {
      rawDeals = await prisma.deal.findMany({
        where: { buyerId: payload.id },
        include: {
          property: true,
          seller: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { closingDate: 'desc' },
      });
    }

    const deals = rawDeals.map(formatDeal);
    return NextResponse.json({ deals });
  } catch (error: any) {
    console.error('Fetch deals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Record a new closed deal / property sale
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can record closed property transactions.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      propertyId,
      buyerId,
      sellerId,
      dealType = 'SALE',
      finalPrice,
      tokenPaid = 0,
      brokerageFee = 0,
      notes,
    } = body;

    if (!propertyId || !buyerId || !sellerId || !finalPrice) {
      return NextResponse.json(
        { error: 'Property, Buyer, Seller, and Final Price are required.' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    const newDeal = await prisma.deal.create({
      data: {
        propertyId,
        buyerId,
        sellerId,
        dealType,
        finalPrice: Number(finalPrice),
        tokenPaid: Number(tokenPaid),
        brokerageFee: Number(brokerageFee),
        closingDate: new Date(),
        status: 'COMPLETED',
        notes,
      },
      include: {
        property: true,
        buyer: true,
        seller: true,
      },
    });

    // If Outright Sale, update property to SOLD
    if (dealType === 'SALE') {
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          occupancyStatus: 'sold',
          isAvailable: false,
        },
      });

      // Record Brokerage Revenue
      if (brokerageFee && Number(brokerageFee) > 0) {
        await prisma.payment.create({
          data: {
            propertyId,
            userId: buyerId,
            title: `Brokerage Commission for ${property.title} Sale`,
            amount: Number(brokerageFee),
            type: 'BROKERAGE',
            status: 'PAID',
            paidAt: new Date(),
            receiptNumber: `COMM-${Date.now().toString().slice(-6)}`,
            transactionId: `TXN-COMM-${Date.now().toString().slice(-4)}`,
          },
        });
      }
    }

    return NextResponse.json(
      { message: `Deal recorded successfully (${dealType}).`, deal: formatDeal(newDeal) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create deal error:', error);
    return NextResponse.json(
      { error: 'Failed to record deal: ' + error.message },
      { status: 500 }
    );
  }
}
