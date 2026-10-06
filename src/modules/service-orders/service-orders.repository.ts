// service-orders.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, lte } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../infra/database/database.module';
import { serviceOrders, vehicles } from '../../infra/database/schema';

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type NewServiceOrder = typeof serviceOrders.$inferInsert;
export type ServiceOrderStatus = ServiceOrder['status'];

@Injectable()
export class ServiceOrdersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Abre a OS e atualiza o km do veículo na MESMA transação.
   * Retorna null se o km informado for menor que o km atual do veículo.
   */
  async openWithKmUpdate(data: NewServiceOrder): Promise<ServiceOrder | null> {
    return this.db.transaction(async (tx) => {
      const updated = await tx
        .update(vehicles)
        .set({ currentKm: data.kmAtService })
        .where(
          and(
            eq(vehicles.id, data.vehicleId),
            lte(vehicles.currentKm, data.kmAtService),
          ),
        )
        .returning({ id: vehicles.id });

      if (updated.length === 0) return null;

      const [order] = await tx.insert(serviceOrders).values(data).returning();
      return order;
    });
  }

  async findById(id: string): Promise<ServiceOrder | undefined> {
    const [row] = await this.db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, id))
      .limit(1);
    return row;
  }

  async findByVehicle(vehicleId: string): Promise<ServiceOrder[]> {
    return this.db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.vehicleId, vehicleId))
      .orderBy(desc(serviceOrders.openedAt));
  }

  /**
   * Muda o status somente se ele ainda for o esperado (from).
   * Retorna undefined se alguém mudou o status nesse meio tempo.
   */
  async transition(
    id: string,
    from: ServiceOrderStatus,
    to: ServiceOrderStatus,
  ): Promise<ServiceOrder | undefined> {
    const [row] = await this.db
      .update(serviceOrders)
      .set({ status: to, closedAt: to === 'DONE' ? new Date() : null })
      .where(and(eq(serviceOrders.id, id), eq(serviceOrders.status, from)))
      .returning();
    return row;
  }
}
