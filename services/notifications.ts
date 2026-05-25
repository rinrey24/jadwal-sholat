/**
 * Adhan notification service.
 * Schedules daily local notifications for each enabled prayer time.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PrayerTimes } from './prayerApi';

// Configure foreground behavior once (call from _layout.tsx)
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const PRAYERS = [
  { key: 'Fajr',    name: 'Subuh'   },
  { key: 'Dhuhr',   name: 'Dzuhur'  },
  { key: 'Asr',     name: 'Ashar'   },
  { key: 'Maghrib', name: 'Maghrib' },
  { key: 'Isha',    name: 'Isya'    },
] as const;

const ADHAN_MESSAGES: Record<string, string> = {
  Fajr:    'Allahu Akbar! Waktunya sholat Subuh telah tiba.',
  Dhuhr:   'Allahu Akbar! Waktunya sholat Dzuhur telah tiba.',
  Asr:     'Allahu Akbar! Waktunya sholat Ashar telah tiba.',
  Maghrib: 'Allahu Akbar! Waktunya sholat Maghrib telah tiba.',
  Isha:    'Allahu Akbar! Waktunya sholat Isya telah tiba.',
};

/**
 * Schedule (or re-schedule) today's adhan notifications.
 * Call this every time prayer times are fetched.
 */
export async function scheduleAdhanNotifications(
  times: PrayerTimes,
  prayerNotify: Record<string, boolean>,
) {
  // Cancel any previously scheduled prayer notifications
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((n) => n.identifier.startsWith('adhan_'))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const now = new Date();

  for (const p of PRAYERS) {
    if (!prayerNotify[p.key]) continue;

    const timeStr = (times as any)[p.key] as string;
    if (!timeStr || timeStr === '--:--') continue;

    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) continue;

    const trigger = new Date();
    trigger.setHours(h, m, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `adhan_${p.key}`,
      content: {
        title: `🕌 ${p.name} — ${timeStr}`,
        body: ADHAN_MESSAGES[p.key],
        sound: true,
        ...(Platform.OS === 'android' && {
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          color: '#2D7A5E',
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  }
}
