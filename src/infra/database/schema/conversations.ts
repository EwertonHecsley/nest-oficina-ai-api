import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('conversations_customer_idx').on(t.customerId)],
);
