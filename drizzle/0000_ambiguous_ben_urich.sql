CREATE TABLE `daily_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`deleted_at` text,
	`dirty` integer DEFAULT true NOT NULL,
	`cycle_id` text NOT NULL,
	`day_index` integer NOT NULL,
	`date` text NOT NULL,
	`practice_minutes` integer,
	`positives` text,
	`obstacles` text,
	`remedies` text,
	FOREIGN KEY (`cycle_id`) REFERENCES `training_cycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_reports_cycle_day` ON `daily_reports` (`cycle_id`,`day_index`);--> statement-breakpoint
CREATE TABLE `meditation_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`deleted_at` text,
	`dirty` integer DEFAULT true NOT NULL,
	`kind` text NOT NULL,
	`content_ref` text,
	`started_at` text NOT NULL,
	`duration_seconds` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reminder_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`deleted_at` text,
	`dirty` integer DEFAULT true NOT NULL,
	`cycle_id` text NOT NULL,
	`week` integer NOT NULL,
	`reminder_id` text NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `training_cycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_notes_cycle_week_reminder` ON `reminder_notes` (`cycle_id`,`week`,`reminder_id`);--> statement-breakpoint
CREATE TABLE `reminder_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`deleted_at` text,
	`dirty` integer DEFAULT true NOT NULL,
	`cycle_id` text NOT NULL,
	`day_index` integer NOT NULL,
	`reminder_id` text NOT NULL,
	`rating` text NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `training_cycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_ratings_cycle_day_reminder` ON `reminder_ratings` (`cycle_id`,`day_index`,`reminder_id`);--> statement-breakpoint
CREATE TABLE `training_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`deleted_at` text,
	`dirty` integer DEFAULT true NOT NULL,
	`program_version` text DEFAULT 'carnet-2019' NOT NULL,
	`start_date` text NOT NULL
);
