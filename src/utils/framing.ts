/**
 * TCP is a byte stream, not a message protocol: one "data" event may carry part
 * of a message, a whole message, or several at once. createFrameSplitter keeps
 * the bytes for a connection and hands back only the complete frames, split on a
 * delimiter. The leftover (an unfinished frame) is kept for the next chunk.
 * Create one splitter per socket.
 */
function createFrameSplitter(delimiterBuffer: Buffer) {
  const delimiter = delimiterBuffer.toString();
  let leftover = "";

  /**
   * Adds a chunk and returns every complete frame now available.
   */
  function push(chunk: Buffer): string[] {
    const parts = (leftover + chunk.toString()).split(delimiter);

    // The last part is whatever came after the final delimiter: an unfinished
    // frame (or "" if the chunk ended exactly on a delimiter). Hold it back.
    leftover = parts.pop() ?? "";

    // Everything before it is complete. Drop empties from back-to-back delimiters.
    return parts.filter((frame) => frame.length > 0);
  }

  /**
   * Returns the buffered bytes that arrived without a trailing delimiter, if
   * any. A connection that closes with a non-empty pending frame sent a message
   * that never ended with the delimiter.
   */
  function pending(): string {
    return leftover;
  }

  return { push, pending };
}

export { createFrameSplitter };
