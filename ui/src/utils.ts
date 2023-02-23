import { AgentPubKey, CellId, encodeHashToBase64 } from "@holochain/client";
import { uniqueNamesGenerator, colors, animals, Config } from "unique-names-generator";


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