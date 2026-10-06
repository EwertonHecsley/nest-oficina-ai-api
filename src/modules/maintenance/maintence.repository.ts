import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../infra/database/database.module';
import { maintenancePlans } from '../../infra/database/schema';

export type MaintenancePlan = typeof maintenancePlans.$inferSelect;
export type NewMaintenancePlan = typeof maintenancePlans.$inferInsert;

@Injectable()
export class MaintenanceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async insert(data: NewMaintenancePlan): Promise<MaintenancePlan> {
    const [row] = await this.db
      .insert(maintenancePlans)
      .values(data)
      .returning();
    return row;
  }

  async findById(id: string): Promise<MaintenancePlan | undefined> {
    const [row] = await this.db
      .select()
      .from(maintenancePlans)
      .where(eq(maintenancePlans.id, id))
      .limit(1);
    return row;
  }

  findByVehicle(vehicleId: string): Promise<MaintenancePlan[]> {
    return this.db
      .select()
      .from(maintenancePlans)
      .where(eq(maintenancePlans.vehicleId, vehicleId));
  }

  async findByVehicleIds(vehicleIds: string[]): Promise<MaintenancePlan[]> {
    if (vehicleIds.length === 0) return []; // evita IN () vazio
    return this.db
      .select()
      .from(maintenancePlans)
      .where(inArray(maintenancePlans.vehicleId, vehicleIds));
  }

  async markDone(
    id: string,
    km: number,
    at: Date,
  ): Promise<MaintenancePlan | undefined> {
    const [row] = await this.db
      .update(maintenancePlans)
      .set({ lastDoneKm: km, lastDoneAt: at })
      .where(eq(maintenancePlans.id, id))
      .returning();
    return row;
  }
}
