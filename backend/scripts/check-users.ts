import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                onboardingCompleted: true,
                provider: true,
            },
        });

        console.log('\n📋 Current Users in Database:\n');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Onboarding Completed: ${user.onboardingCompleted}`);
            console.log(`   Provider: ${user.provider}`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
