import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { relations } from './relations';

export const DRIZZLE = Symbol('DRIZZLE');
export type Database = NodePgDatabase<typeof relations>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const pool = new Pool({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
        });
        return drizzle({ client: pool, relations });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
