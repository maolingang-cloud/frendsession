import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return true;
  }

  return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: parseCorsOrigins()
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  await app.listen(Number(process.env.API_PORT ?? 3301));
}

void bootstrap();
