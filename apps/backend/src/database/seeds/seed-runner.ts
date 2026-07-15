import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "../../modules/user/entities/user.entity";
import { ReportType } from "../../modules/report-types/entities/report-type.entity";
import { AdminSeederService } from "./admin-seeder.service";
import { ReportTypeSeederService } from "./report-type-seeder.service";

dotenv.config();

async function runSeeds() {
    const dataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || "postgres",
        password: String(process.env.DB_PASSWORD ?? "postgres"),
        database: process.env.DB_NAME || "peace_and_security",
        entities: [User, ReportType],
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log("✔ Database connected for seeding");

        const adminSeeder = new AdminSeederService(dataSource);
        const reportTypeSeeder = new ReportTypeSeederService(dataSource);

        console.log("\n--- Seeding Admin ---");
        await adminSeeder.seedAdmin();

        console.log("\n--- Seeding Report Types ---");
        await reportTypeSeeder.seedReportTypes();

        console.log("\n✔ All seeding operations complete");
    } catch (error) {
        console.error("✘ Seeding failed:", error);
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}

runSeeds();
