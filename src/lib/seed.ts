import prisma from './prisma';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    // 1. Check if we already have users
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('Database already has users. Skipping seeding.');
      return;
    }

    console.log('No users found. Seeding database...');

    // 2. Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 3. Create Demo Users
    const adminUser = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@srrentals.com',
        password: hashedPassword,
        phone: '9876543210',
        role: 'admin',
      },
    });

    const ownerUser = await prisma.user.create({
      data: {
        name: 'Rajesh Kumar (Owner)',
        email: 'owner@srrentals.com',
        password: hashedPassword,
        phone: '9876543211',
        role: 'owner',
      },
    });

    const tenantUser = await prisma.user.create({
      data: {
        name: 'Sohel Sheikh',
        email: 'sheikhsohel691@gmail.com',
        password: hashedPassword,
        phone: '9876543212',
        role: 'tenant',
      },
    });

    console.log('Users seeded successfully.');

    // 4. Create Demo Properties
    // We need at least 6 properties for featured displays on the homepage.
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
        livingExperience: 'Managed by Nestaway',
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
        livingExperience: 'Managed by Nestaway',
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
      await prisma.property.create({
        data: prop,
      });
    }

    console.log('Seeded properties successfully.');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}
