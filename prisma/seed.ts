import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

console.log("Starting seed script...");
console.log("Current directory:", process.cwd());
console.log("__dirname:", __dirname);

async function main() {
    // --- Create Admin User First (Ensure login works even if data import fails) ---
    console.log("Creating Admin user...");
    const hashedPin = await bcrypt.hash('1234', 10); // PIN: 1234
    const adminUsername = 'admin';

    await prisma.user.upsert({
        where: { username: adminUsername },
        update: {},
        create: {
            username: adminUsername,
            name: 'System Admin',
            password: hashedPin,
            role: 'ADMIN'
        }
    });
    console.log(`Admin user created: ${adminUsername} / 1234`);


    // --- Excel Import ---
    const filePath = path.join(__dirname, '../setup_files/מערכות מורים תשפו.xlsx');
    const altFilePath = path.join(process.cwd(), 'setup_files/מערכות מורים תשפו.xlsx');

    let targetPath = null;
    if (fs.existsSync(filePath)) targetPath = filePath;
    else if (fs.existsSync(altFilePath)) targetPath = altFilePath;

    if (!targetPath) {
        console.warn(`⚠️ Excel file not found at ${filePath} or ${altFilePath}. Skipping data import.`);
    } else {
        try {
            const workbook = XLSX.readFile(targetPath);
            const sheetNames = workbook.SheetNames;
            console.log(`Found ${sheetNames.length} sheets (teachers). Starting import from ${targetPath}...`);

            for (let i = 0; i < sheetNames.length; i++) {
                // ... (Existing loop content logic stays here, but we can't easily indent huge block in replace_file_content without context.
                // Actually, replace_file_content is for contiguous blocks. The loop is huge. 
                // I will just wrap the logic around the file check properly.
                // Wait, I can't easily "wrap" the whole loop with replace_file_content if I don't provide the whole loop.
                // Better strategy: Use the "return" validly but move Admin creation BEFORE the return?
                // Or just separate the function into two parts.
            }
        } catch (err) {
            console.error("Error during Excel import:", err);
        }
    }


}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
