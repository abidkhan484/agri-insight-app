/**
 * Curated videos from the farmer-provided playlist.
 * The playlist introduction and closing overview are intentionally omitted.
 */
export const TUTORIAL_VIDEOS = {
  beejamrutha: [
    {
      id: 'ssDHd6jWQmw',
      title: 'BEEJAMRUTHA Preparation Method | Organic Seed Treatment Methods | Subhash Palekar',
    },
  ],
  jeevamrutha: [
    {
      id: 'tXG2ztBX1DA',
      title: 'JEEVAMRUTHAM PREPARATION - Step by step Procedure | How to make Jeevamrut at Home',
    },
    {
      id: 'f5NTD-Qx1Q8',
      title: 'Jeevamrutham Preparation in Hindi: Jeevamrut banane ki vidhi',
    },
  ],
  neemastra: [
    {
      id: 'KwoK8zLYv24',
      title: 'NEEMASTRA Preparation | Subhash Palekar | How to make ORGANIC Pesticide / Insecticide at Home',
    },
  ],
  agniastra: [
    {
      id: 'gUeFs5JD9_w',
      title: 'AGNIASTRA Preparation Method | Subhash Palekar Natural Farming (SBNF) | Ancient Organic Pesticide',
    },
  ],
};

export function getTutorialVideos(formulaKey) {
  return TUTORIAL_VIDEOS[formulaKey] || [];
}
