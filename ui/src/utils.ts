import {
  ActionHash,
  AgentPubKey,
  CellId,
  DnaHash,
  DnaHashB64,
  encodeHashToBase64,
} from '@holochain/client';
import {
  uniqueNamesGenerator,
  colors,
  animals,
  Config,
} from 'unique-names-generator';
import {
  AsyncReadable,
  AsyncStatus,
  writable,
} from '@holochain-open-dev/stores';
import { isEqual } from 'lodash-es';

import { CravingMessageStore, CravingNotificationSettings } from './types';

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
  return deepLinkToGroupProps(arr[1]);
}

export function deepLinkToGroupProps(deepLink: string) {
  const arr = deepLink.split('://');
  if (arr.length !== 2 || arr[0] !== 'wordcondenser')
    throw new Error(`Invalid invite link: ${deepLink}`);

  return inviteStringToGroupProps(arr[1]);
}

export function groupPropsToInviteLink(name: string, networkSeed: string) {
  return `https://wordcondenser.com/invite?wordcondenser://${groupPropsToInviteString(
    name,
    networkSeed,
  )}`;
}

export function groupPropsToInviteString(name: string, networkSeed: string) {
  return `${window.btoa(name).replace('+', '&').replace('/', '-')}#${window
    .btoa(networkSeed)
    .replace('+', '&')
    .replace('/', '-')}`;
}

export function inviteStringToGroupProps(input: string): [string, string] {
  const arr = input.split('#');
  if (arr.length !== 2) throw new Error(`Invalid invite string: ${input}`);

  let encodedName = arr[0];
  if (encodedName.endsWith('/')) {
    encodedName = encodedName.slice(0, -1);
  }
  const encodedNetworkSeed = arr[1];

  const name = window.atob(encodedName.replace('&', '+').replace('-', '/'));
  const networkSeed = window.atob(
    encodedNetworkSeed.replace('&', '+').replace('-', '/'),
  );

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

export function getSessionStorageItem<T>(key: string): T | undefined {
  const item: string | null = window.sessionStorage.getItem(key);
  return item ? JSON.parse(item) : undefined;
}

// ================  unread events counts ================

export function newAssociationsCount(
  cravingActionHash: DnaHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingActionHash),
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
  cravingActionHash: DnaHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingActionHash),
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
  cravingActionHash: DnaHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingActionHash),
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
 * @param cravingActionHash
 * @param currentCount
 * @returns
 */
export function newCommentsForReflectionCount(
  cravingActionHash: ActionHash,
  reflectionHash: ActionHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingActionHash),
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
 * @param cravingActionHash
 * @param currentCount
 * @returns
 */
export function newCommentsCount(
  cravingActionHash: DnaHash,
  currentCount: number,
): number {
  const cravingMessageStore = getLocalStorageItem<CravingMessageStore>(
    encodeHashToBase64(cravingActionHash),
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
  cravingActionHash: DnaHashB64,
  newCount: number,
) {
  window.localStorage.setItem(
    `associationsNotified#${cravingActionHash}`,
    JSON.stringify(newCount),
  );
}

export function getNotifiedAssociationsCount(cravingActionHash: DnaHashB64) {
  return getLocalStorageItem<number>(
    `associationsNotified#${cravingActionHash}`,
  );
}

export function setNotifiedCommentsCount(
  cravingActionHash: DnaHashB64,
  newCount: number,
) {
  window.localStorage.setItem(
    `commentsNotified#${cravingActionHash}`,
    JSON.stringify(newCount),
  );
}

export function getNotifiedCommentsCount(cravingActionHash: DnaHashB64) {
  return getLocalStorageItem<number>(`commentsNotified#${cravingActionHash}`);
}

export function setNotifiedOffersCount(
  cravingActionHash: DnaHashB64,
  newCount: number,
) {
  window.localStorage.setItem(
    `offersNotified#${cravingActionHash}`,
    JSON.stringify(newCount),
  );
}

export function getNotifiedOffersCount(cravingActionHash: DnaHashB64) {
  return getLocalStorageItem<number>(`offersNotified#${cravingActionHash}`);
}

export function setNotifiedReflectionsCount(
  cravingActionHash: DnaHashB64,
  newCount: number,
) {
  window.localStorage.setItem(
    `reflectionsNotified#${cravingActionHash}`,
    JSON.stringify(newCount),
  );
}

export function getNotifiedReflectionsCount(cravingActionHash: DnaHashB64) {
  return getLocalStorageItem<number>(
    `reflectionsNotified#${cravingActionHash}`,
  );
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

export function reloadableLazyLoadAndPoll<T>(
  load: () => Promise<T>,
  pollIntervalMs: number,
  errDescription: string,
  firstLoad?: () => Promise<T>,
): AsyncReadable<T> & { reload: () => Promise<void> } {
  const store = writable<AsyncStatus<T>>({ status: 'pending' }, set => {
    let interval: any;
    let currentValue: any;
    let isFirstLoad = true;
    async function loadInner() {
      let value;
      if (isFirstLoad && !!firstLoad) {
        value = await firstLoad();
      } else {
        value = await load();
      }
      if (isFirstLoad || !isEqual(value, currentValue)) {
        currentValue = value;
        isFirstLoad = false;
        set({ status: 'complete', value });
      }
    }
    loadInner()
      .then(() => {
        interval = setInterval(() => {
          loadInner();
        }, pollIntervalMs);
      })
      .catch(e => {
        set({ status: 'error', error: e });
      });
    return () => {
      set({ status: 'pending' });
      if (interval) clearInterval(interval);
    };
  });

  const reload = async () => {
    try {
      const value = await load();
      store.set({
        status: 'complete',
        value,
      });
    } catch (error) {
      store.set({ status: 'error', error });
    }
  };

  return {
    subscribe: store.subscribe,
    reload,
  };
}

export function reloadableLazyLoadAndPollUntil<T>(
  load: () => Promise<T>,
  untilNot: any,
  pollIntervalMs: number,
  errDescription: string,
  firstLoad?: () => Promise<T>,
): AsyncReadable<T> & { reload: () => Promise<void> } {
  const store = writable<AsyncStatus<T>>({ status: 'pending' }, set => {
    let interval: any;
    let currentValue: any;
    let isFirstLoad = true;
    async function loadInner(): Promise<boolean> {
      let value;
      if (isFirstLoad && !!firstLoad) {
        value = await firstLoad();
      } else {
        value = await load();
      }
      if (isFirstLoad || !isEqual(value, currentValue)) {
        currentValue = value;
        isFirstLoad = false;
        set({ status: 'complete', value });
      }
      // The first load may fetch with GetOptions::Local so we still
      // want to poll one more time with GetOptions::Network in any case
      if (!isEqual(value, untilNot) && !isFirstLoad) {
        return false;
      }
      return true;
    }
    loadInner()
      .then(proceed => {
        if (!proceed) return;
        interval = setInterval(() => {
          loadInner()
            .then(proceedFurther => {
              if (!proceedFurther) clearInterval(interval);
            })
            .catch(e => {
              console.warn(errDescription, e);
            });
        }, pollIntervalMs);
      })
      .catch(e => {
        set({ status: 'error', error: e });
      });
    return () => {
      set({ status: 'pending' });
      if (interval) clearInterval(interval);
    };
  });

  const reload = async () => {
    try {
      const value = await load();
      store.set({
        status: 'complete',
        value,
      });
    } catch (error) {
      store.set({ status: 'error', error });
    }
  };

  return {
    subscribe: store.subscribe,
    reload,
  };
}
