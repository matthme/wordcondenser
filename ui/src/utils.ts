import {
  ActionHash,
  AgentPubKey,
  CellId,
  DnaHash,
  DnaHashB64,
  encodeHashToBase64,
} from '@holochain/client';
import { invoke } from '@tauri-apps/api';
import {
  uniqueNamesGenerator,
  colors,
  animals,
  Config,
} from 'unique-names-generator';
import {
  CravingMessageStore,
  CravingNotificationSettings,
  NotificationPayload,
} from './types';

export const isKangaroo = () => (window as any).__HC_KANGAROO__;

export function getNickname(pubKey: AgentPubKey, cravingTitle: string) {
  const pubKeyB64 = encodeHashToBase64(pubKey);
  const seed = pubKeyB64 + cravingTitle;

  const config: Config = {
    dictionaries: [colors, animals],
    separator: ' ',
    seed,
  };

  return uniqueNamesGenerator(config);
}

export function inviteLinkToGroupProps(link: string) {
  const arr = link.split('?');
  if (arr.length !== 2) throw new Error(`Invalid invite link: ${link}`);

  const arr2 = arr[1].split('://');
  if (arr.length !== 2 || arr2[0] !== 'wordcondenser')
    throw new Error(`Invalid invite link: ${link}`);

  return inviteStringToGroupProps(arr2[1]);
}

export function groupPropsToInviteLink(name: string, networkSeed: string) {
  return `https://wordcondenser.com/invite?wordcondenser://${groupPropsToInviteString(
    name,
    networkSeed,
  )}`;
}

export function groupPropsToInviteString(name: string, networkSeed: string) {
  return `${window.btoa(name).replace('+', '%').replace('/', '-')}#${window
    .btoa(networkSeed)
    .replace('+', '%')
    .replace('/', '-')}`;
}

export function inviteStringToGroupProps(input: string): [string, string] {
  const arr = input.split('#');
  if (arr.length !== 2) throw new Error(`Invalid invite string: ${input}`);
  const name = window.atob(arr[0].replace('%', '+').replace('-', '/'));
  const networkSeed = window.atob(arr[1].replace('%', '+').replace('-', '/'));
  return [name, networkSeed];
}

// Crop the image and return a base64 bytes string of its content
export function resizeAndExport(img: HTMLImageElement) {
  const MAX_WIDTH = 300;
  const MAX_HEIGHT = 300;

  let width = img.width;
  let height = img.height;

  // Change the resizing logic
  if (width > height) {
    if (width > MAX_WIDTH) {
      height *= MAX_WIDTH / width;
      width = MAX_WIDTH;
    }
  } else if (height > MAX_HEIGHT) {
    width *= MAX_HEIGHT / height;
    height = MAX_HEIGHT;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0, width, height);

  // return the .toDataURL of the temp canvas
  return canvas.toDataURL();
}

export function getLocalStorageItem<T>(key: string): T | undefined {
  const item: string | null = window.localStorage.getItem(key);
  return item ? JSON.parse(item) : undefined;
}

// ================  unread events counts ================

export function newAssociationsCount(
  cravingDnaHash: DnaHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingDnaHash),
  );
  if (cravingMessageStore) {
    if (
      cravingMessageStore.association_count ||
      cravingMessageStore.association_count === 0
    ) {
      const newAssocations =
        currentCount - cravingMessageStore.association_count;
      if (newAssocations > 0) {
        return newAssocations;
      }
    }
  }
  return 0;
}

export function newOffersCount(
  cravingDnaHash: DnaHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingDnaHash),
  );
  if (cravingMessageStore) {
    if (
      cravingMessageStore.offers_count ||
      cravingMessageStore.offers_count === 0
    ) {
      const newOffers = currentCount - cravingMessageStore.offers_count;
      if (newOffers > 0) {
        // if (
        //   (!cravingMessageStore.offers.notified ||
        //     cravingMessageStore.offers.count >
        //       cravingMessageStore.offers.notified) &&
        //   isKangaroo()
        // ) {
        //   await notifyOs(
        //     {
        //       title: 'New Offer',
        //       body: 'New Offer',
        //       urgency: 'medium',
        //     },
        //     false,
        //     true,
        //   );
        // }
        return newOffers;
      }
    }
  }
  return 0;
}

export function newReflectionsCount(
  cravingDnaHash: DnaHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingDnaHash),
  );
  if (cravingMessageStore) {
    if (cravingMessageStore.reflections) {
      const newReflections =
        currentCount - Object.values(cravingMessageStore.reflections).length;
      if (newReflections > 0) {
        return newReflections;
      }
    }
  }
  return 0;
}

/**
 * Get the counts of new comments for a single Reflection.
 * @param cravingDnaHash
 * @param currentCount
 * @returns
 */
export function newCommentsForReflectionCount(
  cravingDnaHash: DnaHash,
  reflectionHash: ActionHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingDnaHash),
  );
  if (cravingMessageStore) {
    const b64Hash = encodeHashToBase64(reflectionHash);
    if (
      cravingMessageStore.reflections &&
      cravingMessageStore.reflections[b64Hash]
    ) {
      const newComments =
        currentCount - cravingMessageStore.reflections[b64Hash].comments_count;
      if (newComments > 0) {
        return newComments;
      }
    }
  }
  return 0;
}

/**
 * Get the counts of new comments across all Reflections of a Craving.
 * @param cravingDnaHash
 * @param currentCount
 * @returns
 */
export function newCommentsCount(
  cravingDnaHash: DnaHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingDnaHash),
  );
  if (cravingMessageStore) {
    if (
      cravingMessageStore.reflections &&
      Object.values(cravingMessageStore.reflections).length > 0
    ) {
      // count number of reflections
      let numComments = 0;
      // add number of comments for reflections
      Object.values(cravingMessageStore.reflections).forEach(
        ({ comments_count, latest_update }) => {
          numComments += comments_count;
        },
      );
      const newComments = currentCount - numComments;
      if (newComments > 0) {
        return newComments;
      }
    } else {
      // if there are no reflections in the cravingMessageStore yet, then all comments are new comments
      return currentCount;
    }
  }
  return 0;
}

export function setNotifiedAssociationsCount(
  carvingDnaHash: DnaHashB64,
  newCount: number,
) {
  window.localStorage.setItem(
    `associationsNotified#${carvingDnaHash}`,
    JSON.stringify(newCount),
  );
}

export function getNotifiedAssociationsCount(carvingDnaHash: DnaHashB64) {
  return getLocalStorageItem<number>(`associationsNotified#${carvingDnaHash}`);
}

export function setNotifiedCommentsCount(
  carvingDnaHash: DnaHashB64,
  newCount: number,
) {
  window.localStorage.setItem(
    `commentsNotified#${carvingDnaHash}`,
    JSON.stringify(newCount),
  );
}

export function getNotifiedCommentsCount(carvingDnaHash: DnaHashB64) {
  return getLocalStorageItem<number>(`commentsNotified#${carvingDnaHash}`);
}

export function setNotifiedOffersCount(
  carvingDnaHash: DnaHashB64,
  newCount: number,
) {
  window.localStorage.setItem(
    `offersNotified#${carvingDnaHash}`,
    JSON.stringify(newCount),
  );
}

export function getNotifiedOffersCount(carvingDnaHash: DnaHashB64) {
  return getLocalStorageItem<number>(`offersNotified#${carvingDnaHash}`);
}

export function setNotifiedReflectionsCount(
  carvingDnaHash: DnaHashB64,
  newCount: number,
) {
  window.localStorage.setItem(
    `reflectionsNotified#${carvingDnaHash}`,
    JSON.stringify(newCount),
  );
}

export function getNotifiedReflectionsCount(carvingDnaHash: DnaHashB64) {
  return getLocalStorageItem<number>(`reflectionsNotified#${carvingDnaHash}`);
}

export function getCravingNotificationSettings(
  cravingDnaHash: DnaHashB64,
): CravingNotificationSettings {
  const settings = getLocalStorageItem<CravingNotificationSettings>(
    `notificationSettings#${cravingDnaHash}`,
  );
  return (
    settings || {
      associations: { os: false, systray: false, inApp: true },
      offers: { os: false, systray: true, inApp: true },
      reflections: { os: false, systray: true, inApp: true },
      comments: { os: false, systray: true, inApp: true },
    }
  );
}

export function disableCravingNotifications(cravingDnaHash: DnaHashB64): void {
  const settings: CravingNotificationSettings = {
    associations: { os: false, systray: false, inApp: true },
    offers: { os: false, systray: false, inApp: true },
    reflections: { os: false, systray: false, inApp: true },
    comments: { os: false, systray: false, inApp: true },
  };

  window.localStorage.setItem(
    `notificationSettings#${cravingDnaHash}`,
    JSON.stringify(settings),
  );
}

export function enableCravingNotifications(cravingDnaHash: DnaHashB64): void {
  const settings: CravingNotificationSettings = {
    associations: { os: false, systray: false, inApp: true },
    offers: { os: false, systray: true, inApp: true },
    reflections: { os: false, systray: true, inApp: true },
    comments: { os: false, systray: true, inApp: true },
  };

  window.localStorage.setItem(
    `notificationSettings#${cravingDnaHash}`,
    JSON.stringify(settings),
  );
}

export async function notifyOS(
  notification: NotificationPayload,
  os: boolean,
  systray: boolean,
): Promise<void> {
  console.log(
    `%%%%%%%%%% Notifying OS %%%%%%%%%%%%\nos: ${os}, systray: ${systray}, notification: ${JSON.stringify(
      notification,
    )}`,
  );
  return invoke('notify_os', { notification, os, systray });
}
