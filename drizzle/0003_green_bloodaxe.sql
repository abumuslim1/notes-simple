CREATE TABLE `taskBoardColumns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT 'blue',
	`position` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskBoardColumns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`fileName` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`columnId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`assignedToUserId` int,
	`dueDate` timestamp,
	`position` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `taskFiles` ADD CONSTRAINT `taskFiles_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_columnId_taskBoardColumns_id_fk` FOREIGN KEY (`columnId`) REFERENCES `taskBoardColumns`(`id`) ON DELETE cascade ON UPDATE no action;