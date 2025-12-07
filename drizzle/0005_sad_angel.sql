CREATE TABLE `taskTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`tag` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `priority` enum('low','medium','high') DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `taskTags` ADD CONSTRAINT `taskTags_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;