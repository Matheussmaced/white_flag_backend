import type { User } from '@prisma/client';
import type { SettingsResponse } from './settings.schema.js';

export const toSettingsResponse = (user: User): SettingsResponse => ({
  hideNotificationText: user.hideNotificationText,
  hotModeEnabled: user.hotModeEnabled,
});
