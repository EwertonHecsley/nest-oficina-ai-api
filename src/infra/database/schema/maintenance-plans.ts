import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { vehicles } from './vehicles';

export const maintenancePlans = pgTable(
  'maintenance_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    item: varchar('item', { length: 120 }).notNull(),      // ex.: "Filtro de óleo"
    intervalKm: integer('interval_km'),                    // a cada X km (opcional)
    intervalDays: integer('interval_days'),                // a cada X dias (opcional)
    lastDoneKm: integer('last_done_km'),
    lastDoneAt: timestamp('last_done_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('maintenance_plans_vehicle_idx').on(t.vehicleId)],
);


export type MaintenancePlan = typeof maintenancePlans.$inferSelect;
export type NewMaintenancePlan = typeof maintenancePlans.$inferInsert;