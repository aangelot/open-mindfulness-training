CREATE TABLE `book_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`deleted_at` text,
	`dirty` integer DEFAULT true NOT NULL,
	`section_id` text NOT NULL,
	`opened_at` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `book_progress_section` ON `book_progress` (`section_id`);