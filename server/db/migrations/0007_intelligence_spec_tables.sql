-- Spec intelligence domain tables + FTS + optional pgvector
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "banking_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_name" varchar(256) NOT NULL,
	"category" varchar(64) NOT NULL,
	"savings_rate" real NOT NULL,
	"fd_rate" real NOT NULL,
	"rd_rate" real NOT NULL,
	"source" varchar(128) NOT NULL,
	"crawled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banking_rates_crawled_at_idx" ON "banking_rates" USING btree ("crawled_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banking_rates_bank_name_idx" ON "banking_rates" USING btree ("bank_name");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	"exchange" varchar(32) DEFAULT 'NSE' NOT NULL,
	"last_price" real,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"source" varchar(128) NOT NULL,
	"crawled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stocks_symbol_idx" ON "stocks" USING btree ("symbol");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stocks_crawled_at_idx" ON "stocks" USING btree ("crawled_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instrument" varchar(128) NOT NULL,
	"instrument_type" varchar(64) NOT NULL,
	"price" real NOT NULL,
	"unit" varchar(32) DEFAULT 'INR' NOT NULL,
	"source" varchar(128) NOT NULL,
	"crawled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_prices_instrument_idx" ON "market_prices" USING btree ("instrument");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_prices_crawled_at_idx" ON "market_prices" USING btree ("crawled_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fintech_news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(512) NOT NULL,
	"summary" text NOT NULL,
	"category" varchar(128) NOT NULL,
	"source_url" varchar(1024),
	"source_name" varchar(256) NOT NULL,
	"published_at" timestamp with time zone,
	"crawled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" tsvector,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fintech_news_crawled_at_idx" ON "fintech_news" USING btree ("crawled_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fintech_news_search_vector_idx" ON "fintech_news" USING gin ("search_vector");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tax_regimes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regime_name" varchar(128) NOT NULL,
	"jurisdiction" varchar(64) DEFAULT 'IN' NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"effective_from" timestamp with time zone,
	"source" varchar(128) NOT NULL,
	"crawled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" tsvector,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_regimes_search_vector_idx" ON "tax_regimes" USING gin ("search_vector");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geopolitical_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(512) NOT NULL,
	"region" varchar(128) NOT NULL,
	"impact_summary" text NOT NULL,
	"severity" varchar(32) DEFAULT 'medium' NOT NULL,
	"source" varchar(128) NOT NULL,
	"crawled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" tsvector,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geopolitical_events_crawled_at_idx" ON "geopolitical_events" USING btree ("crawled_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "geopolitical_events_search_vector_idx" ON "geopolitical_events" USING gin ("search_vector");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_query_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"query_text" text NOT NULL,
	"route" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_query_history_client_id_idx" ON "user_query_history" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_query_history_session_id_idx" ON "user_query_history" USING btree ("session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_playbooks" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"title" varchar(256) NOT NULL,
	"scenario_type" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_playbooks_client_id_idx" ON "client_playbooks" USING btree ("client_id");
