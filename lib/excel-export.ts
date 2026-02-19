import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';

export async function generateFullScheduleExcel() {
    const teachers = await prisma.teacher.findMany({
        where: { type: { not: 'SUBSTITUTE' } },
        include: {
            schedules: { include: { class: true } }
        },
        orderBy: { lastName: 'asc' }
    });

    const periods = await prisma.period.findMany({ orderBy: { index: 'asc' } });
    const workbook = XLSX.utils.book_new();

    // Days mapping
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

    for (const teacher of teachers) {
        // Sheet Name: Full Name
        let sheetName = `${teacher.lastName} ${teacher.firstName}`.substring(0, 31);
        // Ensure unique sheet name
        let counter = 1;
        while (workbook.SheetNames.includes(sheetName)) {
            sheetName = `${teacher.lastName} ${teacher.firstName} ${counter}`.substring(0, 31);
            counter++;
        }

        const wsData = [];

        // Header Row
        wsData.push(['שעה / יום', ...days]); // Row 0

        // Time Slots 1 to 10
        for (let i = 1; i <= 10; i++) {
            const row = [];
            const period = periods.find(p => p.index === i);
            let timeLabel = `${i}`;
            if (period && period.startTime && period.endTime) {
                timeLabel += `\n${period.startTime}-${period.endTime}`;
            }
            row.push(timeLabel); // Col 0

            // Days 0-5
            for (let day = 0; day < 6; day++) {
                const item = teacher.schedules.find(s => s.dayOfWeek === day && s.hourIndex === i);
                if (item) {
                    // Content format: Subject \n Class \n Type
                    let content = item.subject || '';
                    if (item.class?.name) content += `\n${item.class.name}`;

                    // Add Type if not REGULAR or explicitly needed
                    if (item.type === 'STAY') content += '\nשהייה';
                    else if (item.type === 'INDIVIDUAL') content += '\nפרטני';
                    else if (item.type === 'MEETING') content += '\nישיבה';

                    row.push(content);
                } else {
                    row.push('');
                }
            }
            wsData.push(row);
        }

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function generateSubstitutesExcel() {
    const substitutes = await prisma.teacher.findMany({
        where: { type: 'SUBSTITUTE' },
        include: { user: true }
    });

    const workbook = XLSX.utils.book_new();
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Username', 'PIN Code'];

    const data = substitutes.map(sub => ([
        sub.firstName,
        sub.lastName,
        sub.email,
        sub.phone,
        sub.user?.username || '',
        sub.user?.displayPin || '****'
    ]));

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(workbook, ws, 'Substitutes');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
