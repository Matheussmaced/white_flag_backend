-- AlterTable
ALTER TABLE `users` ADD COLUMN `hide_notification_text` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `feelings` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `mode` ENUM('NORMAL', 'HOT') NOT NULL DEFAULT 'NORMAL',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `feelings_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flags` (
    `id` CHAR(36) NOT NULL,
    `couple_id` CHAR(36) NOT NULL,
    `sender_id` CHAR(36) NOT NULL,
    `receiver_id` CHAR(36) NOT NULL,
    `feeling_id` CHAR(36) NOT NULL,
    `idempotency_key` VARCHAR(100) NOT NULL,
    `seen_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `flags_couple_id_created_at_idx`(`couple_id`, `created_at`),
    INDEX `flags_receiver_id_idx`(`receiver_id`),
    UNIQUE INDEX `flags_sender_id_idempotency_key_key`(`sender_id`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devices` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `platform` ENUM('IOS', 'ANDROID') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `devices_token_key`(`token`),
    INDEX `devices_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `flags` ADD CONSTRAINT `flags_couple_id_fkey` FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flags` ADD CONSTRAINT `flags_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flags` ADD CONSTRAINT `flags_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flags` ADD CONSTRAINT `flags_feeling_id_fkey` FOREIGN KEY (`feeling_id`) REFERENCES `feelings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
