CREATE TABLE `licenseKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licenseId` int NOT NULL,
	`key` varchar(256) NOT NULL,
	`ownerName` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `licenseKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `licenseKeys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` varchar(64) NOT NULL,
	`ownerName` text,
	`expiresAt` timestamp,
	`trialStartedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `licenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `licenses_serverId_unique` UNIQUE(`serverId`)
);
--> statement-breakpoint
ALTER TABLE `licenseKeys` ADD CONSTRAINT `licenseKeys_licenseId_licenses_id_fk` FOREIGN KEY (`licenseId`) REFERENCES `licenses`(`id`) ON DELETE cascade ON UPDATE no action;