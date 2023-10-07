//                           light-green  yellow    blue      pinkish-red  lightblue   purple    warm-red  medium-blue green
export const rainbowColors = [
  '#2efc05',
  '#fcf805',
  '#0202fc',
  '#fc0563',
  '#11f8f1',
  '#9611fc',
  '#d80000',
  '#11aef7',
  '#00d627',
];

export function getHexColorForString(input: string) {
  const firstLetterCharCode = input.charCodeAt(0);
  const lengthOfinput = input.length;
  return rainbowColors[
    (firstLetterCharCode * lengthOfinput) % rainbowColors.length
  ];
}

export function getHexColorForTimestamp(timestamp: number) {
  return rainbowColors[timestamp % rainbowColors.length];
}
