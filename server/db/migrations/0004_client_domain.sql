CREATE TABLE IF NOT EXISTS "clients" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"external_ref" varchar(128),
	"display_name" varchar(256) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_profiles" (
	"client_id" varchar(64) PRIMARY KEY NOT NULL,
	"profile" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_records" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"pan_card" varchar(16),
	"risk_profile" varchar(64),
	"employment_sector" varchar(128),
	"verification_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_rate_snapshots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"source" varchar(128) NOT NULL,
	"feed_type" varchar(64) DEFAULT 'savings_fd' NOT NULL,
	"rates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolio_holdings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"instrument" varchar(256) NOT NULL,
	"category" varchar(128) NOT NULL,
	"allocation_pct" real,
	"market_value_inr" real,
	"tax_section" varchar(64),
	"as_of_date" timestamp with time zone DEFAULT now() NOT NULL,
	"import_batch_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kyc_records" ADD CONSTRAINT "kyc_records_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_external_ref_idx" ON "clients" USING btree ("external_ref");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_status_idx" ON "clients" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_profiles_updated_at_idx" ON "client_profiles" USING btree ("updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kyc_records_client_id_idx" ON "kyc_records" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kyc_records_status_idx" ON "kyc_records" USING btree ("verification_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_rate_snapshots_fetched_at_idx" ON "market_rate_snapshots" USING btree ("fetched_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_rate_snapshots_source_idx" ON "market_rate_snapshots" USING btree ("source");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolio_holdings_client_id_idx" ON "portfolio_holdings" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolio_holdings_batch_idx" ON "portfolio_holdings" USING btree ("import_batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolio_holdings_as_of_idx" ON "portfolio_holdings" USING btree ("as_of_date");
