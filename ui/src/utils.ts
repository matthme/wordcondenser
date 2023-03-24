import { AgentPubKey, CellId, DnaHash, encodeHashToBase64 } from "@holochain/client";
import { uniqueNamesGenerator, colors, animals, Config } from "unique-names-generator";
import { CravingMessageStore } from "./types";


export function getNickname(pubKey: AgentPubKey, cravingTitle: string) {
  const pubKeyB64 = encodeHashToBase64(pubKey);
  const seed = pubKeyB64 + cravingTitle;

  const config: Config = {
    dictionaries: [colors, animals],
    separator: " ",
    seed,
  };

  return uniqueNamesGenerator(config);

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
      height = height * (MAX_WIDTH / width);
      width = MAX_WIDTH;
    }
  } else {
    if (height > MAX_HEIGHT) {
      width = width * (MAX_HEIGHT / height);
      height = MAX_HEIGHT;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0, width, height);

  // return the .toDataURL of the temp canvas
  return canvas.toDataURL();
}







// ================  unread events counts ================


export function newAssociationsCount(cravingDnaHash: DnaHash, currentCount: number): number {
  const cravingMessageStoreJson = window.localStorage.getItem(encodeHashToBase64(cravingDnaHash));
  if (cravingMessageStoreJson) {
    const cravingMessageStore: CravingMessageStore = JSON.parse(cravingMessageStoreJson);
    if (cravingMessageStore.association_count) {
      const newAssocations = currentCount - cravingMessageStore.association_count;
      if (newAssocations > 0) {
        return newAssocations
      }
    }
  }
  return 0
}


export function newOffersCount(cravingDnaHash: DnaHash, currentCount: number): number {
  const cravingMessageStoreJson = window.localStorage.getItem(encodeHashToBase64(cravingDnaHash));
  if (cravingMessageStoreJson) {
    const cravingMessageStore: CravingMessageStore = JSON.parse(cravingMessageStoreJson);
    if (cravingMessageStore.offers_count) {
      const newOffers = currentCount - cravingMessageStore.offers_count;
      if (newOffers > 0) {
        return newOffers
      }
    }
  }
  return 0
}


export function newReflectionsCount(cravingDnaHash: DnaHash, currentCount: number): number {
  const cravingMessageStoreJson = window.localStorage.getItem(encodeHashToBase64(cravingDnaHash));
  if (cravingMessageStoreJson) {
    const cravingMessageStore: CravingMessageStore = JSON.parse(cravingMessageStoreJson);
    if (cravingMessageStore.reflections) {
      const newReflections = currentCount - Object.values(cravingMessageStore.reflections).length;
      if (newReflections > 0) {
        return newReflections
      }
    }
  }
  return 0
}

/**
 * Get the counts of new comments for a Craving.
 * @param cravingDnaHash
 * @param currentCount
 * @returns
 */
export function newCommentsCount(cravingDnaHash: DnaHash, currentCount: number): number {
  const cravingMessageStoreJson = window.localStorage.getItem(encodeHashToBase64(cravingDnaHash));
  console.log("@newCommentsCount: cravingMessageStoreJson: ", cravingMessageStoreJson);
  if (cravingMessageStoreJson) {
    const cravingMessageStore: CravingMessageStore = JSON.parse(cravingMessageStoreJson);
    if (cravingMessageStore.reflections && Object.values(cravingMessageStore.reflections).length > 0) {
      // count number of reflections
      let numComments = Object.values(cravingMessageStore.reflections).length;
      // add number of comments for reflections
      Object.values(cravingMessageStore.reflections).forEach(({ comments_count, latest_update}) => numComments += comments_count);
      const newComments = currentCount - numComments;
      if (newComments > 0) {
        return newComments
      }
    }
  }
  return 0
}