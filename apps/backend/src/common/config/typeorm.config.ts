import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";
config();

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: ["dist/**/*.entity.js"],
  migrations: ["dist/migrations/*.js"],
};

export default new DataSource(dataSourceOptions);
