export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'has', 'have',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'are', 'was', 'were', 'been', 'be',
    'what', 'when', 'where', 'who', 'how', 'why', 'this', 'that', 'these',
    'those', 'it', 'its', 'they', 'them', 'their'
  ]);
  
  const uniqueWords = new Set(
    words
      .filter(word => !stopWords.has(word))
      .map(word => stemWord(word))
  );
  
  return Array.from(uniqueWords);
}

function stemWord(word: string): string {
  if (word.length < 4) return word;
  
  if (word.endsWith('ing') && word.length > 5) {
    return word.slice(0, -3);
  }
  if (word.endsWith('ed') && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  if (word.endsWith('ly') && word.length > 4) {
    return word.slice(0, -2);
  }
  
  return word;
}
