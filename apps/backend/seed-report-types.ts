/**
 * Standalone report-type seed script.
 * Run with: npx ts-node -r tsconfig-paths/register seed-report-types.ts
 * Or via npm script: npm run seed:report-types
 */
import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import { DataSource } from "typeorm";
import { ReportType } from "./src/modules/report-types/entities/report-type.entity";
import { ReportTypeEnum } from "./src/common/enums/enums";

const REPORT_TYPE_SEEDS = [
    {
        name: ReportTypeEnum.NOISE,
        description:
            "Report excessive noise violations such as loud music, construction noise, or industrial sounds that disturb the community.",
        isActive: true,
        residentialDecibelThreshold: 45.0,
        commercialDecibelThreshold: 55.0,
    },
    {
        name: ReportTypeEnum.LITTERING,
        description:
            "Report illegal disposal of waste, garbage, or refuse in public spaces, streets, parks, or waterways.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.VANDALISM,
        description:
            "Report deliberate destruction or defacement of public or private property, including graffiti and property damage.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.AIR_POLLUTION,
        description:
            "Report sources of harmful air quality degradation such as industrial smoke, vehicle emissions, or open burning.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.WATER_POLLUTION,
        description:
            "Report contamination of rivers, lakes, streams, or other water bodies by chemicals, sewage, or other harmful substances.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.SOIL_CONTAMINATION,
        description:
            "Report the presence of hazardous chemicals or pollutants in the soil that may pose health or environmental risks.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.ILLEGAL_DUMPING,
        description:
            "Report unauthorized disposal of large quantities of waste on public or private land outside of approved facilities.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.DEFORESTATION,
        description:
            "Report illegal or unsanctioned clearing, cutting, or burning of forests and trees in protected or regulated areas.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.HAZARDOUS_WASTE,
        description:
            "Report improper handling, storage, or disposal of hazardous materials including chemicals, batteries, electronics, or medical waste.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.WILDLIFE_POACHING,
        description:
            "Report illegal hunting, trapping, capturing, or trading of protected wildlife and animals.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.OTHERS,
        description:
            "Report other environmental or community violations not covered by the specific categories above.",
        isActive: true,
    },
];

async function seed() {
    const dataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || process.env.DB_DATABASE,
        entities: [ReportType],
        synchronize: false,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    await dataSource.initialize();
    console.log("✔ Database connected");

    const repo = dataSource.getRepository(ReportType);
    let seeded = 0;
    let skipped = 0;

    for (const seed of REPORT_TYPE_SEEDS) {
        const existing = await repo.findOneBy({ name: seed.name });
        if (existing) {
            console.log(`  • Skipping "${seed.name}" — already exists`);
            skipped++;
            continue;
        }
        const entity = repo.create(seed);
        await repo.save(entity);
        console.log(`  ✔ Seeded "${seed.name}"`);
        seeded++;
    }

    console.log(`\nDone! Seeded: ${seeded}, Skipped: ${skipped}`);
    await dataSource.destroy();
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
