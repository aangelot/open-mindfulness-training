ALTER TABLE `daily_reports` ADD `obstacle_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_reports` ADD `remedy_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `training_cycles` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `training_cycles` ADD `ended_at` text;