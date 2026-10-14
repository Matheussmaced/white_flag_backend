-- AlterTable
ALTER TABLE `users` ADD COLUMN `hot_mode_enabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `diary_entries` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `note` VARCHAR(500) NULL,
    `starred` BOOLEAN NOT NULL DEFAULT false,
    `mood` VARCHAR(30) NULL,
    `together_moment` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `diary_entries_user_id_date_key`(`user_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peace_rules` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `mode` ENUM('NORMAL', 'HOT') NOT NULL DEFAULT 'NORMAL',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `peace_rules_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peace_contents` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `body` VARCHAR(600) NOT NULL,
    `mode` ENUM('NORMAL', 'HOT') NOT NULL DEFAULT 'NORMAL',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `peace_contents_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peace_events` (
    `id` CHAR(36) NOT NULL,
    `couple_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `notified_partner` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `peace_events_couple_id_created_at_idx`(`couple_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `diary_entries` ADD CONSTRAINT `diary_entries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peace_events` ADD CONSTRAINT `peace_events_couple_id_fkey` FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peace_events` ADD CONSTRAINT `peace_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
