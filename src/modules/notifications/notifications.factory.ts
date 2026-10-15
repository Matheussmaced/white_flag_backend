import { waitUntil } from '@vercel/functions';
import type { FastifyInstance } from 'fastify';
import { createPushSender } from '../../lib/push-sender.js';
import { prisma } from '../../lib/prisma.js';
import { PrismaDevicesRepository } from '../devices/devices.repository.js';
import { NotificationsService } from './notifications.service.js';

export const createNotificationsService = (app: FastifyInstance) =>
  new NotificationsService(
    new PrismaDevicesRepository(prisma),
    createPushSender(app.log),
    app.log,
    waitUntil,
  );
