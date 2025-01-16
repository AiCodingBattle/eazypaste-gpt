import * as GPTTokenizer from 'gpt-tokenizer';

export function estimateTokenCount(text: string): number {
  try {
    // Normalize line endings to \n and handle consecutive whitespace
    const normalizedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, '    '); // Convert tabs to 4 spaces as GPT often does
      
    // Use the default encoding which is cl100k_base (used by GPT-3.5/4)
    const tokens = GPTTokenizer.encode(normalizedText);
    return tokens.length;
  } catch (error) {
    console.error('Error estimating token count:', error);
    // Fallback to a more accurate estimation based on GPT's tokenization patterns
    // Count special characters, spaces, and newlines more accurately
    const specialChars = text.match(/[^a-zA-Z0-9\s]/g)?.length || 0;
    const words = text.split(/\s+/).length;
    const lines = text.split('\n').length;
    const basicTokens = Math.ceil(text.length / 4);
    
    // Adjust token count based on special characters, word boundaries, and line breaks
    return Math.ceil(basicTokens + (specialChars * 0.5) + (words * 0.2) + (lines * 0.1));
  }
} 