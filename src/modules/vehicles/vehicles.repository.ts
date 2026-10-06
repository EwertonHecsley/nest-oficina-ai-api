import { Inject, Injectable } from '@nestjs/common';
import { vehicles } from '../../infra/database/schema';
import { type Database, DRIZZLE } from '../../infra/database/database.module';
import { eq } from 'drizzle-orm';

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

@Injectable()
export class VehiclesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async insert(data: NewVehicle): Promise<Vehicle> {
    const [row] = await this.db.insert(vehicles).values(data).returning();
    return row;
  }

  async findByPlate(plate: string): Promise<Vehicle | undefined> {
    const [row] = await this.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.plate, plate))
      .limit(1);
    return row;
  }

  async findByCustomer(customerId: string): Promise<Vehicle[]> {
    return this.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.customerId, customerId));
  }

  async findById(id: string): Promise<Vehicle | undefined> {
    const [row] = await this.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);
    return row;
  }
}
