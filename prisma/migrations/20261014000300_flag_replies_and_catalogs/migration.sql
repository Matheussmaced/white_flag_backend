-- CreateTable
CREATE TABLE `decline_reasons` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `mode` ENUM('NORMAL', 'HOT') NOT NULL DEFAULT 'NORMAL',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `decline_reasons_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accept_notes` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `mode` ENUM('NORMAL', 'HOT') NOT NULL DEFAULT 'NORMAL',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `accept_notes_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dice_challenges` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `mode` ENUM('NORMAL', 'HOT') NOT NULL DEFAULT 'NORMAL',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `dice_challenges_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flag_replies` (
    `id` CHAR(36) NOT NULL,
    `flag_id` CHAR(36) NOT NULL,
    `responder_id` CHAR(36) NOT NULL,
    `type` ENUM('ACCEPT', 'DECLINE') NOT NULL,
    `decline_reason_id` CHAR(36) NULL,
    `accept_note_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `flag_replies_flag_id_key`(`flag_id`),
    INDEX `flag_replies_responder_id_idx`(`responder_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `flag_replies` ADD CONSTRAINT `flag_replies_flag_id_fkey` FOREIGN KEY (`flag_id`) REFERENCES `flags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_replies` ADD CONSTRAINT `flag_replies_responder_id_fkey` FOREIGN KEY (`responder_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_replies` ADD CONSTRAINT `flag_replies_decline_reason_id_fkey` FOREIGN KEY (`decline_reason_id`) REFERENCES `decline_reasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_replies` ADD CONSTRAINT `flag_replies_accept_note_id_fkey` FOREIGN KEY (`accept_note_id`) REFERENCES `accept_notes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
