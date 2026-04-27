/**
 * Utility to split text into overlapping chunks.
 */
export const splitIntoChunks = (
  text: string, 
  chunkSize: number = 800, 
  overlap: number = 200
): string[] => {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // If not at the end, try to find the last sentence boundary or space
    if (endIndex < text.length) {
      const remainingText = text.substring(startIndex, endIndex + 20); // peek a bit further
      const lastSentence = remainingText.lastIndexOf('.');
      const lastQuestion = remainingText.lastIndexOf('?');
      const lastExclamation = remainingText.lastIndexOf('!');
      
      const boundary = Math.max(lastSentence, lastQuestion, lastExclamation);
      
      if (boundary > chunkSize / 2) {
        endIndex = startIndex + boundary + 1;
      } else {
        // Fallback to last space
        const lastSpace = text.substring(startIndex, endIndex).lastIndexOf(' ');
        if (lastSpace > chunkSize / 2) {
          endIndex = startIndex + lastSpace;
        }
      }
    }

    chunks.push(text.substring(startIndex, endIndex).trim());
    startIndex = endIndex - overlap;
    
    // Safety break if we aren't moving
    if (startIndex >= text.length - overlap && chunks.length > 1) {
      const lastPart = text.substring(endIndex - overlap).trim();
      if (lastPart.length > 5) chunks.push(lastPart);
      break;
    }
  }

  return chunks.filter(c => c.length > 10);
};
