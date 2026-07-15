import "reflect-metadata";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: String(process.env.DB_PASSWORD ?? "postgres"),
  database: process.env.DB_NAME || "eco-guard",
  entities: ["dist/modules/**/entities/*.js"],
  migrations: ["dist/database/migrations/*.js"],
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
});
