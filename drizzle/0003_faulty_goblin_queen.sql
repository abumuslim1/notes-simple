CREATE TABLE `taskCommentFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`fileName` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskCommentFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `taskCommentFiles` ADD CONSTRAINT `taskCommentFiles_commentId_taskComments_id_fk` FOREIGN KEY (`commentId`) REFERENCES `taskComments`(`id`) ON DELETE cascade ON UPDATE no action;