CREATE TYPE "service_order_status" AS ENUM('OPEN', 'IN_PROGRESS', 'DONE');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" uuid NOT NULL,
	"plate" varchar(8) NOT NULL UNIQUE,
	"model" varchar(120) NOT NULL,
	"year" integer NOT NULL,
	"current_km" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vehicle_id" uuid NOT NULL,
	"status" "service_order_status" DEFAULT 'OPEN'::"service_order_status" NOT NULL,
	"description" text NOT NULL,
	"cost" numeric(12,2),
	"km_at_service" integer NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "maintenance_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vehicle_id" uuid NOT NULL,
	"item" varchar(120) NOT NULL,
	"interval_km" integer,
	"interval_days" integer,
	"last_done_km" integer,
	"last_done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "vehicles_customer_idx" ON "vehicles" ("customer_id");--> statement-breakpoint
CREATE INDEX "service_orders_vehicle_idx" ON "service_orders" ("vehicle_id");--> statement-breakpoint
CREATE INDEX "maintenance_plans_vehicle_idx" ON "maintenance_plans" ("vehicle_id");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE;