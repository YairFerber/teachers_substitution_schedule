import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function importScheduleFromExcel(buffer: ArrayBuffer) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;

    console.log(`[Import] Found ${sheetNames.length} sheets. Starting import...`);

    // Transaction? Or just sequential? Overwrite implies we should probably clear old data first.
    // "overwrite the DB" -> clear tables?
    // User wants to overwrite.
    // Let's clear Schedule, Class, Teacher tables? 
    // Clearing Teacher might delete Users if they cascade? 
    // User table links to Teacher. If we delete Teacher, what happens to User? 
    // Users might have specific passwords active. User said "same format... overwrite".
    // If I delete teachers, I break existing user links.
    // Maybe I should *upsert* teachers and clear *Schedule* first?
    // If a teacher is removed in the new file, they should be removed from DB?
    // "overwrite the DB" usually means "Make DB state = File state".
    // Safest approach:
    // 1. Delete all Schedules.
    // 2. Delete all Substitutions (since schedules are gone).
    // 3. Upsert Teachers from file.
    // 4. (Optional) Delete Teachers not in file?
    // Let's start with: Delete all Schedule and Substitution items. Then re-seed.

    // Clear Schedule and Substitutions
    await prisma.substitution.deleteMany({});
    await prisma.schedule.deleteMany({});

    // Cache existing classes to avoid repetitive DB calls
    const existingClasses = await prisma.class.findMany();
    const classSet = new Set(existingClasses.map(c => c.name));
    const newClasses = new Set<string>();

    const schedulesToCreate: any[] = [];

    for (let i = 0; i < sheetNames.length; i++) {
        const sheetName = sheetNames[i];
        if (sheetName === 'Database Instructions' || sheetName.startsWith('!')) continue;

        // Names
        const nameParts = sheetName.trim().split(' ');
        const lastName = nameParts.length > 1 ? nameParts[0] : '';
        const firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
        const email = `${sheetName.replace(/\s+/g, '.')}@school.test`;

        const teacher = await prisma.teacher.upsert({
            where: { email },
            update: { firstName, lastName }, // Update name if changed
            create: {
                firstName,
                lastName,
                email,
                phone: '000-0000000',
            }
        });

        // Ensure User exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: sheetName },
                    { teacher: { id: teacher.id } }
                ]
            }
        });

        if (!existingUser) {
            const pin = Math.floor(1000 + Math.random() * 9000).toString();
            const hashedPin = await bcrypt.hash(pin, 10);
            await prisma.user.create({
                data: {
                    username: sheetName,
                    name: sheetName,
                    password: hashedPin,
                    displayPin: pin,
                    role: 'TEACHER',
                    teacher: { connect: { id: teacher.id } }
                }
            });
        }

        // Parse Sheet
        const sheet = workbook.Sheets[sheetName];
        if (!sheet['!ref']) continue;
        const range = XLSX.utils.decode_range(sheet['!ref']);

        for (let R = 1; R <= range.e.r; ++R) {
            let hourIndex: number | null = null;
            for (let C = 0; C <= 6; ++C) {
                // Time Column C=0
                if (C === 0) {
                    const timeCell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (timeCell && timeCell.v) {
                        const timeVal = (timeCell.v as string).trim();
                        const parts = timeVal.split(/[\n\r]+/);
                        const index = parseInt(parts[0]);
                        if (!isNaN(index)) {
                            hourIndex = index;
                            // Time range... reusing existing periods if they exist
                        }
                    }
                    continue;
                }

                if (hourIndex === null) continue;

                const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
                if (!cell) continue;

                const content = (cell.v as string).trim();
                if (!content) continue;

                const contentLines = content.split(/[\n\r]+/).map(s => s.trim()).filter(s => s.length > 0);

                let subject: string | null = null;
                let className: string | null = null;
                let typeRaw: string | null = null;

                if (contentLines.length > 0) subject = contentLines[0];
                if (contentLines.length > 1) className = contentLines[1];
                if (contentLines.length > 2) typeRaw = contentLines[2];

                let type = 'REGULAR';
                const typeToCheck = typeRaw || '';
                if (typeToCheck.includes('שהייה') || content.includes('שהייה')) type = 'STAY';
                else if (typeToCheck.includes('פרטני') || content.includes('פרטני')) type = 'INDIVIDUAL';
                else if (typeToCheck.includes('ישיבה') || content.includes('צוות')) type = 'MEETING';

                if (className && className.length < 50) {
                    if (!classSet.has(className)) {
                        newClasses.add(className);
                        classSet.add(className);
                    }
                }

                schedulesToCreate.push({
                    teacherId: teacher.id,
                    dayOfWeek: C - 1, // 0-6
                    hourIndex: hourIndex,
                    classId: (className && className.length < 50) ? className : null,
                    type: type,
                    subject: subject,
                });
            }
        }
    }


    // Batch Create Classes
    if (newClasses.size > 0) {
        console.log(`Creating ${newClasses.size} new classes...`);
        const newClassArray = Array.from(newClasses).map(name => ({ id: name, name }));
        // Execute in chunks just in case
        for (let i = 0; i < newClassArray.length; i += 100) {
            await prisma.class.createMany({
                data: newClassArray.slice(i, i + 100),
                skipDuplicates: true
            });
        }
    }

    // Batch Create Schedules
    console.log(`Creating ${schedulesToCreate.length} schedule items...`);
    // Chunk size 500 is safe
    const CHUNK_SIZE = 500;
    for (let i = 0; i < schedulesToCreate.length; i += CHUNK_SIZE) {
        const chunk = schedulesToCreate.slice(i, i + CHUNK_SIZE);
        await prisma.schedule.createMany({
            data: chunk
        });
    }
}
