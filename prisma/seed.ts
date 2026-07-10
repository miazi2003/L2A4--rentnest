import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/db';

async function main() {
  /* eslint-disable no-console */
  console.log('🌱 Starting database seeding...');

  // Clean existing database records in reverse dependency order
  console.log('Cleaning existing database data...');
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.rentalRequest.deleteMany();
  await prisma.property.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Property Categories
  console.log('Creating default property categories...');
  const categoriesData = [
    {
      name: 'Apartment',
      description: 'Self-contained housing units occupying part of a building.',
    },
    {
      name: 'House',
      description: 'Standalone residential buildings constructed for single-family occupancy.',
    },
    {
      name: 'Studio',
      description: 'Compact apartment combining living, bedroom, and kitchen into one area.',
    },
    {
      name: 'Villa',
      description: 'Luxurious, spacious country or coastal estates with premium features.',
    },
    {
      name: 'Shared Room',
      description: 'Shared living and sleeping environments suitable for students or co-livers.',
    },
  ];

  const createdCategories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: cat,
    });
    createdCategories.push(created);
  }
  console.log(`Successfully created ${createdCategories.length} categories.`);

  // 2. Seed Default Users with Hashed Passwords
  console.log('Creating default users...');
  const adminPassword = await bcrypt.hash('Admin@RentNest2027', 10);
  const landlordPassword = await bcrypt.hash('Landlord@RentNest2026', 10);
  const tenantPassword = await bcrypt.hash('Tenant@RentNest2026', 10);

  // Default Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@rentnest.com',
      password: adminPassword,
      name: 'System Admin',
      phone: '01711111111',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Sample Landlord
  const landlord = await prisma.user.create({
    data: {
      email: 'landlord@rentnest.com',
      password: landlordPassword,
      name: 'John Landlord',
      phone: '01722222222',
      role: UserRole.LANDLORD,
      status: UserStatus.ACTIVE,
    },
  });

  // Sample Tenant
  const tenant = await prisma.user.create({
    data: {
      email: 'tenant@rentnest.com',
      password: tenantPassword,
      name: 'Jane Tenant',
      phone: '01733333333',
      role: UserRole.TENANT,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Created users:');
  console.log(` - Admin: ${admin.email}`);
  console.log(` - Landlord: ${landlord.email}`);
  console.log(` - Tenant: ${tenant.email}`);

  // 3. Seed Sample Properties
  console.log('Creating sample properties...');
  const apartmentCategory = createdCategories.find((c) => c.name === 'Apartment');
  const villaCategory = createdCategories.find((c) => c.name === 'Villa');

  if (apartmentCategory && villaCategory) {
    const prop1 = await prisma.property.create({
      data: {
        title: 'Modern Cozy Apartment',
        description:
          'Beautiful 2-bedroom apartment located in downtown. Fully furnished with security services.',
        price: 1200.0,
        address: '123 Main Street, Suite 4B, Downtown',
        latitude: 40.7128,
        longitude: -74.006,
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
        availability: 'AVAILABLE',
        landlordId: landlord.id,
        categoryId: apartmentCategory.id,
      },
    });

    const prop2 = await prisma.property.create({
      data: {
        title: 'Luxury Oceanfront Villa',
        description:
          'Exquisite 4-bedroom villa with private pool, direct beach access, and panoramic sea views.',
        price: 4500.0,
        address: '88 Ocean Boulevard, Seaside',
        latitude: 34.0194,
        longitude: -118.4912,
        images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227'],
        availability: 'AVAILABLE',
        landlordId: landlord.id,
        categoryId: villaCategory.id,
      },
    });

    console.log(`Created sample properties: "${prop1.title}", "${prop2.title}"`);
  }

  console.log('🌱 Database seeding complete!');
  /* eslint-enable no-console */
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
