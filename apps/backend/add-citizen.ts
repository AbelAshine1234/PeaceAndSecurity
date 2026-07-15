
import { AppDataSource } from './src/database/data-source';
import { Citizen } from './src/modules/citizen/entities/citizen.entity';
import { UserStatus } from './src/common/enums/enums';
import { hashPassword } from './src/common/utils/password.util';

async function addTestCitizen() {
    try {
        await AppDataSource.initialize();
        console.log('Database initialized');

        const citizenRepo = AppDataSource.getRepository(Citizen);

        const phoneNumber = '+251911000000';
        const existing = await citizenRepo.findOne({ where: { phoneNumber } });

        if (!existing) {
            const hashedPin = await hashPassword('1234');
            const citizen = citizenRepo.create({
                fullName: 'Test Citizen',
                phoneNumber,
                userCode: 'CIT12345',
                status: UserStatus.ACTIVE,
                pin: hashedPin
            });
            await citizenRepo.save(citizen);
            console.log('Added test citizen.');
        } else {
            console.log('Test citizen already exists.');
        }

        const citizens = await citizenRepo.find();
        console.log(`Total citizens in DB: ${citizens.length}`);
        citizens.forEach(c => console.log(`- ${c.fullName} (${c.phoneNumber})`));

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error adding test citizen:', error);
    }
}

addTestCitizen();
