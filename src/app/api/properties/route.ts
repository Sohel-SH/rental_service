import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken, verifyToken } from '@/lib/jwt';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const location = searchParams.get('location');
    const city = searchParams.get('city');
    const propertyType = searchParams.get('propertyType');
    const bhk = searchParams.get('bhk');
    const maxPrice = searchParams.get('maxPrice');
    const purchaseMode = searchParams.get('purchaseMode');
    const sortBy = searchParams.get('sortBy');
    const tenantType = searchParams.get('tenantType');

    // Custom popup filters
    const livingExperience = searchParams.get('livingExperience');
    const lookingFor = searchParams.get('lookingFor');
    const availableFor = searchParams.get('availableFor');
    const budgetRange = searchParams.get('budgetRange');
    const furnishingType = searchParams.get('furnishingType');
    const carpetArea = searchParams.get('carpetArea');
    const parking = searchParams.get('parking');
    const availability = searchParams.get('availability');

    // Build query filter
    const filter: any = { isAvailable: true };

    if (location) {
      filter.OR = [
        { location: { contains: location } },
        { title: { contains: location } }
      ];
    }
    
    if (city && city !== 'all' && city !== '') {
      // If location is already filtering, append city filter inside AND
      if (filter.OR) {
        filter.AND = [
          { OR: filter.OR },
          { location: { contains: city } }
        ];
        delete filter.OR;
      } else {
        filter.location = { contains: city };
      }
    }
    
    if (propertyType && propertyType !== 'all') {
      filter.propertyType = propertyType;
    }
    if (bhk && bhk !== 'all') {
      filter.bhk = Number(bhk);
    }
    
    // MaxPrice takes priority unless budgetRange is specified
    if (maxPrice && maxPrice !== 'all') {
      filter.price = { lte: Number(maxPrice) };
    }
    if (purchaseMode && purchaseMode !== 'all') {
      filter.listingOption = purchaseMode;
    }
    if (tenantType && tenantType !== 'all') {
      filter.description = { contains: tenantType };
    }

    // Modal filters maps
    if (livingExperience && livingExperience !== 'all') {
      filter.livingExperience = livingExperience;
    }
    if (lookingFor && lookingFor !== 'all') {
      filter.lookingFor = lookingFor;
    }
    if (availableFor && availableFor !== 'all') {
      filter.availableFor = availableFor;
    }
    if (furnishingType && furnishingType !== 'all') {
      filter.furnishingType = furnishingType;
    }
    if (parking && parking !== 'all') {
      filter.parking = parking;
    }
    if (availability && availability !== 'all') {
      filter.availability = availability;
    }

    // Budget range parsing
    if (budgetRange && budgetRange !== 'all') {
      if (budgetRange === 'Below 5K') {
        filter.price = { lte: 5000 };
      } else if (budgetRange === '5K - 10K') {
        filter.price = { gte: 5000, lte: 10000 };
      } else if (budgetRange === '10K - 15K') {
        filter.price = { gte: 10000, lte: 15000 };
      } else if (budgetRange === '15K - 20K') {
        filter.price = { gte: 15000, lte: 20000 };
      } else if (budgetRange === '20K - 30K') {
        filter.price = { gte: 20000, lte: 30000 };
      } else if (budgetRange === '30K - 40K') {
        filter.price = { gte: 30000, lte: 40000 };
      } else if (budgetRange === '40K - 50K') {
        filter.price = { gte: 40000, lte: 50000 };
      } else if (budgetRange === 'Above 50K+') {
        filter.price = { gte: 50000 };
      }
    }

    // Carpet area parsing
    if (carpetArea && carpetArea !== 'all') {
      if (carpetArea === 'Below 500') {
        filter.carpetArea = { lte: 500 };
      } else if (carpetArea === '500 - 1000') {
        filter.carpetArea = { gte: 500, lte: 1000 };
      } else if (carpetArea === '1000 - 1500') {
        filter.carpetArea = { gte: 1000, lte: 1500 };
      } else if (carpetArea === '1500 - 2000') {
        filter.carpetArea = { gte: 1500, lte: 2000 };
      } else if (carpetArea === '2000 - 3000') {
        filter.carpetArea = { gte: 2000, lte: 3000 };
      } else if (carpetArea === 'Above 3000+') {
        filter.carpetArea = { gte: 3000 };
      }
    }

    // Sorting order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const rawProperties = await prisma.property.findMany({
      where: filter,
      orderBy: orderBy,
    });

    // Map comma-separated images string back to array for the frontend
    const properties = rawProperties.map((prop: any) => ({
      ...prop,
      images: prop.images ? prop.images.split(',') : [],
    }));

    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error('Fetch properties error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching listings.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const body = await request.json();

    const {
      title,
      description,
      price,
      location,
      propertyType,
      bhk,
      images,
      latitude,
      longitude,
      listingOption,
      livingExperience,
      lookingFor,
      availableFor,
      furnishingType,
      carpetArea,
      parking,
      availability,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
    } = body;

    let ownerId: string | null = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.id) {
        ownerId = payload.id;
        // Upgrade tenant to owner role if listing a property
        if (payload.role === 'tenant') {
          await prisma.user.update({
            where: { id: payload.id },
            data: { role: 'owner' },
          });
        }
      }
    }

    // If no active session but landlord contact info provided, register/login landlord seamlessly
    if (!ownerId && ownerEmail) {
      let user = await prisma.user.findUnique({
        where: { email: ownerEmail },
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(ownerPassword || 'password123', 10);
        user = await prisma.user.create({
          data: {
            name: ownerName || 'Property Owner',
            email: ownerEmail,
            phone: ownerPhone || '',
            password: hashedPassword,
            role: 'owner',
          },
        });
      } else if (user.role === 'tenant') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'owner' },
        });
      }

      ownerId = user.id;

      // Issue JWT session cookie for instant landlord login
      const newToken = await signToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      cookieStore.set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Please log in or provide your contact details to list your property.' },
        { status: 401 }
      );
    }

    if (!title || !description || !price || !location || !propertyType || !bhk) {
      return NextResponse.json(
        { error: 'Missing required property details (Title, Description, Price, Location, Type, BHK).' },
        { status: 400 }
      );
    }

    const newProperty = await prisma.property.create({
      data: {
        title,
        description,
        price: Number(price),
        location,
        propertyType,
        bhk: Number(bhk),
        images: Array.isArray(images) ? images.join(',') : typeof images === 'string' ? images : '',
        ownerId,
        isAvailable: true,
        listingOption: listingOption || 'rent',
        latitude: latitude ? Number(latitude) : 18.5913,
        longitude: longitude ? Number(longitude) : 73.7389,
        livingExperience: livingExperience || 'Managed by Owner',
        lookingFor: lookingFor || 'House',
        availableFor: availableFor || 'Family',
        furnishingType: furnishingType || 'Semi Furnished',
        carpetArea: carpetArea ? Number(carpetArea) : 800,
        parking: parking || 'Two Wheeler',
        availability: availability || 'Immediate',
      },
    });

    const propertyResponse = {
      ...newProperty,
      images: newProperty.images ? newProperty.images.split(',') : [],
    };

    return NextResponse.json(
      { message: 'Property listed successfully.', property: propertyResponse },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create property error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'owner' && payload.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required.' }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    // Owner check
    if (payload.role === 'owner' && property.ownerId !== payload.id) {
      return NextResponse.json(
        { error: 'Forbidden. You do not own this property.' },
        { status: 403 }
      );
    }

    await prisma.property.delete({ where: { id: propertyId } });
    return NextResponse.json({ message: 'Property listing deleted successfully.' });
  } catch (error: any) {
    console.error('Delete property error:', error);
    return NextResponse.json(
      { error: 'Failed to delete property: ' + error.message },
      { status: 500 }
    );
  }
}
