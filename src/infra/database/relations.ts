import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  customers: {
    vehicles: r.many.vehicles(),
  },
  vehicles: {
    customer: r.one.customers({
      from: r.vehicles.customerId,
      to: r.customers.id,
    }),
    serviceOrders: r.many.serviceOrders(),
    maintenancePlans: r.many.maintenancePlans(),
  },
  serviceOrders: {
    vehicle: r.one.vehicles({
      from: r.serviceOrders.vehicleId,
      to: r.vehicles.id,
    }),
  },
  maintenancePlans: {
    vehicle: r.one.vehicles({
      from: r.maintenancePlans.vehicleId,
      to: r.vehicles.id,
    }),
  },
}));
