import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'site_settings.json');

const DEFAULT_SETTINGS = {
  companyName: 'S.R Rental Services',
  tagline: 'Your premium rental management partner in Hinjawadi, Pune.',
  address: 'Hinjawadi Phase 1, Pune, Maharashtra 411057',
  phone: '+91 98765 43210',
  email: 'support@srrentals.com',
  whatsapp: '917218661327',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  linkedin: 'https://linkedin.com',
  twitter: 'https://twitter.com',
  youtube: 'https://youtube.com',
};

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading settings file:', err);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing settings file:', err);
    return false;
  }
}

// GET: Fetch public site settings & social links
export async function GET() {
  const settings = getSettings();
  return NextResponse.json({ settings });
}

// PUT: Update site settings (Admin only)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const body = await request.json();
    const current = getSettings();
    const updated = {
      ...current,
      ...body,
    };

    const saved = saveSettings(updated);
    if (!saved) {
      return NextResponse.json({ error: 'Failed to persist settings.' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Site settings and social media links updated successfully.',
      settings: updated,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings: ' + error.message },
      { status: 500 }
    );
  }
}
