export const RANKS = [
  "Gen","Lt Gen","Maj Gen","Brig Gen","Col","Lt Col","Maj",
  "Capt","Lt","2Lt","WO1","WO2","S/Sgt","Sgt","Cpl","Pte",
] as const;
export type Rank = typeof RANKS[number];
