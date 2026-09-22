import prisma from './prisma';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    // 1. Get or Create Demo Users
    let adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    let ownerUser = await prisma.user.findFirst({ where: { role: 'owner' } });
    let tenantUser = await prisma.user.findFirst({ where: { role: 'tenant' } });

    const hashedPassword = await bcrypt.hash('password123', 10);

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          name: 'System Admin',
          email: 'admin@srrentals.com',
          password: hashedPassword,
          phone: '9876543210',
          role: 'admin',
        },
      });
    }

    if (!ownerUser) {
      ownerUser = await prisma.user.create({
        data: {
          name: 'Rajesh Kumar (Owner)',
          email: 'owner@srrentals.com',
          password: hashedPassword,
          phone: '9876543211',
          role: 'owner',
        },
      });
    }

    if (!tenantUser) {
      tenantUser = await prisma.user.create({
        data: {
          name: 'Sohel Sheikh',
          email: 'sheikhsohel691@gmail.com',
          password: hashedPassword,
          phone: '9876543212',
          role: 'tenant',
        },
      });
    }

    // 2. Check if we already have properties
    let createdProps = await prisma.property.findMany();
    if (createdProps.length === 0) {
      console.log('No properties found. Seeding demo properties...');
    const propertiesData = [
      {
        title: 'Premium 2 BHK Furnished Apartment near Hinjawadi Phase 1',
        description: 'Stunning fully furnished 2 BHK apartment in a gated society with high-speed internet, power backup, and dedicated parking. Perfect for working professionals in Hinjawadi IT park. Experience premium living with close proximity to top corporate offices.',
        price: 22000,
        location: 'Hinjawadi Phase 1',
        propertyType: 'apartment',
        bhk: 2,
        images: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
        ownerId: ownerUser.id,
        isAvailable: true,
        listingOption: 'rent',
        latitude: 18.5913,
        longitude: 73.7389,
        livingExperience: 'Managed by S.R Rentals',
        lookingFor: 'House',
        availableFor: 'Boys',
        furnishingType: 'Fully Furnished',
        carpetArea: 950,
        parking: 'Four Wheeler',
        availability: 'Immediate',
      },
      {
        title: 'Shared Cozy PG Room for Boys in Hinjawadi Phase 2',
        description: 'Comfortable shared room available in a highly-rated co-living space. Rent includes food, housekeeping, high-speed Wi-Fi, and laundry services. Walking distance from major IT parks in Phase 2.',
        price: 8500,
        location: 'Hinjawadi Phase 2',
        propertyType: 'pg',
        bhk: 1,
        images: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop',
        ownerId: ownerUser.id,
        isAvailable: true,
        listingOption: 'rent',
        latitude: 18.5930,
        longitude: 73.7340,
        livingExperience: 'Select (Premium Furnished)',
        lookingFor: 'Bed',
        availableFor: 'Boys',
        furnishingType: 'Fully Furnished',
        carpetArea: 400,
        parking: 'Two Wheeler',
        availability: 'Immediate',
      },
      {
        title: 'Luxury 3 BHK Villa in Hinjawadi Hills',
        description: 'Spacious independent 3 BHK villa with a private garden, scenic views, and modern architecture. High-end furnishing and secure neighborhood, ideal for families seeking peace and quiet away from the hustle.',
        price: 45000,
        location: 'Hinjawadi Hills',
        propertyType: 'house',
        bhk: 3,
        images: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop',
        ownerId: ownerUser.id,
        isAvailable: true,
        listingOption: 'rent',
        latitude: 18.5875,
        longitude: 73.7250,
        livingExperience: 'Managed by Owner',
        lookingFor: 'House',
        availableFor: 'Family',
        furnishingType: 'Semi Furnished',
        carpetArea: 1800,
        parking: 'Four Wheeler',
        availability: 'Within 7 Days',
      },
      {
        title: 'Elegant 1 BHK Apartment near Hinjawadi Chowk',
        description: 'Cozy and modern 1 BHK apartment situated at a prime location near Hinjawadi Chowk. Easily accessible public transport, markets, and restaurants nearby. Excellent option for young professionals or couples.',
        price: 15000,
        location: 'Hinjawadi Chowk',
        propertyType: 'apartment',
        bhk: 1,
        images: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
        ownerId: ownerUser.id,
        isAvailable: true,
        listingOption: 'rent',
        latitude: 18.5950,
        longitude: 73.7420,
        livingExperience: 'Managed by Owner',
        lookingFor: 'House',
        availableFor: 'Family',
        furnishingType: 'Semi Furnished',
        carpetArea: 650,
        parking: 'Two Wheeler',
        availability: 'Immediate',
      },
      {
        title: 'Single Private Room for Girls in Premium Co-Living PG',
        description: 'Single occupancy private room in an exclusive all-girls premium co-living property. Features 24/7 security, gym access, shared kitchen, high-speed internet, and power backup.',
        price: 12000,
        location: 'Hinjawadi Phase 1',
        propertyType: 'pg',
        bhk: 1,
        images: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop',
        ownerId: ownerUser.id,
        isAvailable: true,
        listingOption: 'rent',
        latitude: 18.5925,
        longitude: 73.7370,
        livingExperience: 'Managed by S.R Rentals',
        lookingFor: 'Room',
        availableFor: 'Girls',
        furnishingType: 'Fully Furnished',
        carpetArea: 350,
        parking: 'Two Wheeler',
        availability: 'Immediate',
      },
      {
        title: 'Modern 2 BHK Semi-Furnished Flat in Hinjawadi Phase 3',
        description: 'Semi-furnished 2 BHK apartment featuring spacious balconies, modular kitchen, and great ventilation. Located near Quadron Business Park in Phase 3. Society offers a swimming pool and clubhouse.',
        price: 18000,
        location: 'Hinjawadi Phase 3',
        propertyType: 'apartment',
        bhk: 2,
        images: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
        ownerId: ownerUser.id,
        isAvailable: true,
        listingOption: 'rent',
        latitude: 18.5850,
        longitude: 73.7150,
        livingExperience: 'Managed by Owner',
        lookingFor: 'House',
        availableFor: 'Family',
        furnishingType: 'Semi Furnished',
        carpetArea: 900,
        parking: 'Four Wheeler',
        availability: 'Within 15 Days',
      },
      {
        title: 'Spacious Commercial Office Space in Phase 2 Tech Park',
        description: 'Fully corporate-ready commercial office space located in a prime tech park in Hinjawadi Phase 2. High-speed elevators, centralized AC, cafeteria, and extensive parking facilities.',
        price: 85000,
        location: 'Hinjawadi Phase 2',
        propertyType: 'commercial',
        bhk: 0,
        images: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
        ownerId: ownerUser.id,
        isAvailable: true,
        listingOption: 'rent',
        latitude: 18.5945,
        longitude: 73.7310,
        livingExperience: 'Managed by Owner',
        lookingFor: 'House',
        availableFor: 'Boys',
        furnishingType: 'Unfurnished',
        carpetArea: 2500,
        parking: 'Four Wheeler',
        availability: 'Within 15 Days',
      }
    ];

      for (const prop of propertiesData) {
        const created = await prisma.property.create({
          data: prop,
        });
        createdProps.push(created);
      }

      console.log('Seeded properties successfully.');
    }

    // 3. Seed Demo Leases & Vacancies if none exist
    const leaseCount = await prisma.lease.count();
    if (leaseCount === 0 && createdProps.length >= 2) {
      const activeProp = createdProps[0];
      const vacatingProp = createdProps[1];

      // Active Lease for Demo Tenant
      const lease1 = await prisma.lease.create({
        data: {
          propertyId: activeProp.id,
          tenantId: tenantUser.id,
          ownerId: ownerUser.id,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
          endDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000), // 9 months remaining
          durationMonths: 11,
          monthlyRent: 22000,
          securityDeposit: 44000,
          status: 'ACTIVE',
        },
      });

      // Update property 1 occupancy
      await prisma.property.update({
        where: { id: activeProp.id },
        data: { occupancyStatus: 'occupied', isAvailable: false },
      });

      // Vacating Soon Property (Notice Submitted)
      const vacatingDate = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000); // 12 days from now
      await prisma.lease.create({
        data: {
          propertyId: vacatingProp.id,
          tenantId: tenantUser.id,
          ownerId: ownerUser.id,
          startDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
          endDate: vacatingDate,
          durationMonths: 6,
          monthlyRent: 8500,
          securityDeposit: 17000,
          status: 'NOTICE_PERIOD',
          noticeDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          vacatingDate: vacatingDate,
          noticeReason: 'Relocating to another city for work assignment.',
        },
      });

      // Update property 2 occupancy to vacating_soon for pre-booking
      await prisma.property.update({
        where: { id: vacatingProp.id },
        data: {
          occupancyStatus: 'vacating_soon',
          isAvailable: true,
          vacantFromDate: vacatingDate,
        },
      });

      // 6. Seed Demo Payments
      await prisma.payment.createMany({
        data: [
          {
            leaseId: lease1.id,
            propertyId: activeProp.id,
            userId: tenantUser.id,
            title: 'Security Deposit (Escrow)',
            amount: 44000,
            type: 'SECURITY_DEPOSIT',
            status: 'PAID',
            paymentMethod: 'Bank Transfer',
            transactionId: 'TXN-DEP-884920',
            receiptNumber: 'RCP-DEP-001',
            paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
          {
            leaseId: lease1.id,
            propertyId: activeProp.id,
            userId: tenantUser.id,
            title: 'Monthly Rent - Last Month',
            amount: 22000,
            type: 'RENT',
            status: 'PAID',
            paymentMethod: 'UPI',
            transactionId: 'TXN-UPI-992144',
            receiptNumber: 'RCP-RENT-002',
            paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            leaseId: lease1.id,
            propertyId: activeProp.id,
            userId: tenantUser.id,
            title: 'Monthly Rent - Current Month',
            amount: 22000,
            type: 'RENT',
            status: 'PENDING',
            paymentMethod: 'UPI',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
          {
            propertyId: activeProp.id,
            userId: tenantUser.id,
            title: 'S.R Rentals Facilitation & Brokerage Fee',
            amount: 11000,
            type: 'BROKERAGE',
            status: 'PAID',
            paymentMethod: 'UPI',
            transactionId: 'TXN-COMM-773121',
            receiptNumber: 'RCP-COMM-003',
            paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      // 7. Seed Demo Closed Deals (Sale & Rental Record)
      await prisma.deal.createMany({
        data: [
          {
            propertyId: createdProps[2].id, // 3 BHK Villa
            buyerId: tenantUser.id,
            sellerId: ownerUser.id,
            dealType: 'SALE',
            finalPrice: 8500000, // 85 Lakhs
            tokenPaid: 500000,
            brokerageFee: 85000,
            closingDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            status: 'COMPLETED',
            notes: 'Registry completed at Sub-Registrar Office, Hinjawadi. Full payment transferred.',
          },
          {
            propertyId: activeProp.id,
            buyerId: tenantUser.id,
            sellerId: ownerUser.id,
            dealType: 'RENTAL_LEASE',
            finalPrice: 22000,
            tokenPaid: 22000,
            brokerageFee: 11000,
            closingDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            status: 'COMPLETED',
            notes: '11-Month registered agreement executed.',
          },
        ],
      });

      console.log('Seeded Leases, Payments, and Deals successfully.');
    }
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}
