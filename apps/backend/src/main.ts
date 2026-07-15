import { NestFactory } from "@nestjs/core";
// restart trigger 3
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as express from "express";
import { join } from "path";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const configService = app.get<ConfigService>(ConfigService);
  const backendUrl =
    configService.get<string>("BASE_URL");
  const allowedOriginsRaw = configService.get<string>("ALLOWED_ORIGINS") || "";
  const extraOrigins = allowedOriginsRaw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = [
    ...extraOrigins
  ].filter(Boolean);

  console.log("allowed origins", allowedOrigins)

  app.enableCors({
    origin: (origin, callback) => {
      // Allow if no origin (e.g. mobile apps, curl) or if it's in the allowed list
      if (!origin || allowedOrigins.includes(origin) || configService.get("NODE_ENV") === "development") {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error(`CORS blocked for ${origin}`));
      }
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
  });

  app.setGlobalPrefix("api");

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle("Peace and Security Backend API")
    .setDescription(
      "Complete API documentation for Peace and Security Backend\n\n" +
      `**Base URL**: ${backendUrl}\n`,
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addServer(backendUrl, "Production Server")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  const port = parseInt(configService.get<string>("PORT") || "1221", 10);
  await app.listen(port);
  console.log(`Server running on port ${port}`);
  console.log(`Swagger documentation available at ${backendUrl}/docs`);
}
bootstrap();
