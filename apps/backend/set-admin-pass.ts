
import "reflect-metadata";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import { User } from "./src/modules/user/entities/user.entity";

dotenv.config();

async function setAdminPassword() {
    const dataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || "postgres",
        password: String(process.env.DB_PASSWORD ?? "postgres"),
        database: process.env.DB_NAME || "eco-guard",
        entities: [User],
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        const userRepo = dataSource.getRepository(User);
        const adminPhone = "+251900000000";
        const admin = await userRepo.findOne({ where: { phoneNumber: adminPhone } });

        if (admin) {
            admin.password = await bcrypt.hash("password", 10);
            admin.isPasswordSet = true;
            admin.status = "ACTIVE" as any;
            await userRepo.save(admin);
            console.log("Admin password set to 'password'");
        } else {
            console.log("Admin user not found");
        }
    } catch (error) {
        console.error("Failed:", error);
    } finally {
        await dataSource.destroy();
    }
}

setAdminPassword();
