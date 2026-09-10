import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({
      message: 'Seeding check completed successfully. Demo owner, tenant, admin, and properties verified.',
    });
  } catch (error: any) {
    console.error('Seeding API error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database: ' + error.message },
      { status: 500 }
    );
  }
}
