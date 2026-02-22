/**
 * Filters an array of block UIDs to keep only top-level blocks
 * (blocks that don't have any parent in the same array).
 */
export function filterTopLevelBlocks(blockUids) {
  if (!blockUids || blockUids.length === 0) return [];
  if (blockUids.length === 1) return blockUids;

  const query = `[:find ?uid
                  :in $ [?all-uids ...]
                  :where
                  [?block :block/uid ?all-uids]
                  [?block :block/parents ?parent]
                  [?parent :block/uid ?parent-uid]
                  [(contains? #{${blockUids
                    .map((uid) => `"${uid}"`)
                    .join(" ")}} ?parent-uid)]
                  [?block :block/uid ?uid]]`;

  try {
    const result = window.roamAlphaAPI.q(query, blockUids);
    const blocksWithParentsInArray = new Set(
      result ? result.map(([uid]) => uid) : [],
    );
    return blockUids.filter((uid) => !blocksWithParentsInArray.has(uid));
  } catch (error) {
    console.error("Error in filterTopLevelBlocks:", error);
    return blockUids;
  }
}

export function getBlockContentByUid(uid) {
  if (!uid) return "";
  let result = window.roamAlphaAPI.pull("[:block/string]", [":block/uid", uid]);
  if (result) return result[":block/string"];
  else return "";
}
