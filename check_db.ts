import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import 'dotenv/config';

console.log("Database URL from env:", process.env.DATABASE_URL);

const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Attempting to connect to database...");
    const count = await prisma.user.count();
    console.log(`Connection successful! Found ${count} users.`);
}

main()
    .catch((e) => {
        console.error("Connection failed:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
