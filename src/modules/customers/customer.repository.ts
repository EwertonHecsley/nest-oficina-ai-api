import { Inject, Injectable } from '@nestjs/common';
import { customers } from '../../infra/database/schema';
import { type Database, DRIZZLE } from '../../infra/database/database.module';
import { eq } from 'drizzle-orm';

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

@Injectable()
export class CustomerRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async insert(data: NewCustomer): Promise<Customer> {
    const [row] = await this.db.insert(customers).values(data).returning();
    return row;
  }

  async findById(id: string): Promise<Customer | undefined> {
    const [row] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);
    return row;
  }
}
