-- CreateTable
CREATE TABLE `couples` (
    `id` CHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'ENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ended_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `couple_members` (
    `id` CHAR(36) NOT NULL,
    `couple_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `active_user_id` CHAR(36) NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `couple_members_active_user_id_key`(`active_user_id`),
    INDEX `couple_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `couple_members_couple_id_user_id_key`(`couple_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `couple_members` ADD CONSTRAINT `couple_members_couple_id_fkey` FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `couple_members` ADD CONSTRAINT `couple_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

