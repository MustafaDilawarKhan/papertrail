// src/utils/citationIndexer.js
// Recalculates globalIndex for all citations after any block reorder.

/**
 * Extract all citation IDs from a block's content (HTML string with data-cite-id attributes).
 */
export function extractCitationIds(block) {
  const ids = []
  if (!block) return ids

  // Check content field (sections, abstract, acknowledgment, appendix)
  const content = block.content || ''
  const regex = /data-cite-id="([^"]+)"/g
  let match
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[1])
  }

  return ids
}

/**
 * Recalculates globalIndex for all citations based on order of first appearance.
 * Called after every REORDER_BLOCKS dispatch.
 */
export function recalculateCitationIndices(blocks, citations) {
  const seen = new Map()
  let counter = 1

  for (const block of blocks) {
    const citeIds = extractCitationIds(block)
    for (const id of citeIds) {
      if (!seen.has(id)) {
        seen.set(id, counter++)
      }
    }
  }

  return citations.map(c => ({
    ...c,
    globalIndex: seen.get(c.id) ?? 0,
  }))
}

/**
 * Compute which blocks each citation is used in.
 */
export function computeUsedInBlocks(blocks, citations) {
  const usageMap = new Map()

  for (const block of blocks) {
    const citeIds = extractCitationIds(block)
    for (const id of citeIds) {
      if (!usageMap.has(id)) usageMap.set(id, [])
      if (!usageMap.get(id).includes(block.id)) {
        usageMap.get(id).push(block.id)
      }
    }
  }

  return citations.map(c => ({
    ...c,
    usedInBlocks: usageMap.get(c.id) || [],
  }))
}
