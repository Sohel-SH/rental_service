import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to format document objects for frontend compatibility
function formatDoc(doc: any) {
  if (!doc) return null;
  return {
    ...doc,
    _id: doc.id,
    userId: doc.user ? {
      ...doc.user,
      _id: doc.user.id,
    } : null,
  };
}

// GET: Fetch documents based on user role
export async function GET() {
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

    let rawDocs = [];

    if (payload.role === 'admin') {
      // Admins see all documents
      rawDocs = await prisma.document.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Landlords and tenants see their own uploaded documents
      rawDocs = await prisma.document.findMany({
        where: { userId: payload.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    const documents = rawDocs.map(formatDoc);
    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents: ' + error.message },
      { status: 500 }
    );
  }
}

// POST: Upload a new document (saves file locally in public/uploads)
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and documentType are required.' },
        { status: 400 }
      );
    }

    // Verify documentType values
    const validTypes = ['id_proof', 'agreement', 'property_papers'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type selection.' },
        { status: 400 }
      );
    }

    // Parse file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Setup local upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Save file with unique timestamp prefix
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    // Save document details to MySQL
    const newDoc = await prisma.document.create({
      data: {
        userId: payload.id,
        documentType,
        fileUrl,
        fileName: file.name,
        status: 'pending',
      },
    });

    return NextResponse.json(
      { message: 'Document uploaded successfully.', document: { ...newDoc, _id: newDoc.id } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT: Verify or Reject a document (Admins only)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admins only can approve documents.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { documentId, status } = body;

    if (!documentId || !status) {
      return NextResponse.json(
        { error: 'Document ID and new status are required.' },
        { status: 400 }
      );
    }

    const validStatus = ['verified', 'rejected', 'pending'];
    if (!validStatus.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid document status.' },
        { status: 400 }
      );
    }

    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: { status },
    });

    return NextResponse.json({
      message: 'Document status updated successfully.',
      document: { ...updatedDoc, _id: updatedDoc.id },
    });
  } catch (error: any) {
    console.error('Update document status error:', error);
    return NextResponse.json(
      { error: 'Failed to update document: ' + error.message },
      { status: 500 }
    );
  }
}
