import { pgTable, pgEnum, uuid, text, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { vehicles } from './vehicles';

export const serviceOrderStatus = pgEnum('service_order_status', ['OPEN', 'IN_PROGRESS', 'DONE']);

export const serviceOrders = pgTable(
  'service_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    status: serviceOrderStatus('status').notNull().default('OPEN'),
    description: text('description').notNull(),
    cost: numeric('cost', { precision: 12, scale: 2 }),
    kmAtService: integer('km_at_service').notNull(),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (t) => [index('service_orders_vehicle_idx').on(t.vehicleId)],
);

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type NewServiceOrder = typeof serviceOrders.$inferInsert;