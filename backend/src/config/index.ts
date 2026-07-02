import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),
  CDN_BASE_URL: z.string().default('http://localhost:3000/uploads'),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  MAX_VIDEO_SIZE_MB: z.coerce.number().default(500),
  MAX_PROFILE_IMAGE_SIZE_MB: z.coerce.number().default(10),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  TOTP_SECRET_LENGTH: z.coerce.number().default(20),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
  UPLOAD_RATE_LIMIT_MAX: z.coerce.number().default(5),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
});

let parsed: z.infer<typeof envSchema>;

try {
  parsed = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    const missing = err.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error(`\n[Config] Missing or invalid environment variables:\n${missing}\n`);
    process.exit(1);
  }
  throw err;
}

export const config = parsed;
export type Config = typeof config;
