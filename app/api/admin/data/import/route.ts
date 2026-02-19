import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { importScheduleFromExcel } from '@/lib/excel-import';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        await importScheduleFromExcel(buffer);

        return NextResponse.json({ success: true, message: 'Database updated successfully' });
    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to import data: ' + (error as Error).message }, { status: 500 });
    }
}
