import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingUsers() {
    try {
        // Get all users where onboardingCompleted is false
        const usersToUpdate = await prisma.user.findMany({
            where: {
                onboardingCompleted: false,
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        console.log(`Found ${usersToUpdate.length} users with onboardingCompleted = false`);

        // Update all users to have onboardingCompleted = true
        const result = await prisma.user.updateMany({
            where: {
                onboardingCompleted: false,
            },
            data: {
                onboardingCompleted: true,
            },
        });

        console.log(`✅ Updated ${result.count} users`);
        console.log('All existing users now have onboardingCompleted = true');
    } catch (error) {
        console.error('❌ Error updating users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixExistingUsers();
