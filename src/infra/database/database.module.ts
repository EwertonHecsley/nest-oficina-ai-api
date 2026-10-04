import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

export const DRIZZLE = Symbol('DRIZZLE');
export type Database = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const pool = new Pool({ connectionString: config.getOrThrow<string>('DATABASE_URL') });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}