/**
 * Calculate ELO rating change
 * @param currentRating - User's current ELO rating
 * @param questionDifficulty - Question's ELO difficulty
 * @param scoreOutOf10 - User's score (0-10)
 * @param kFactor - How much ratings change (default 32)
 * @returns New rating and change amount
 */
export function calculateEloChange(
  currentRating: number,
  questionDifficulty: number,
  scoreOutOf10: number,
  kFactor: number = 32
): { newRating: number; change: number } {
  // Expected score based on rating difference
  const expectedScore = 1 / (1 + Math.pow(10, (questionDifficulty - currentRating) / 400));
  
  // Actual score (normalized to 0-1)
  const actualScore = scoreOutOf10 / 10;
  
  // Rating change
  const change = Math.round(kFactor * (actualScore - expectedScore));
  
  const newRating = currentRating + change;
  
  return {
    newRating: Math.max(800, Math.min(2200, newRating)), // Cap between 800-2200
    change
  };
}

/**
 * Get rating band name
 */
export function getRatingBand(rating: number): string {
  if (rating < 1000) return 'Entry Level PM';
  if (rating < 1200) return 'Associate PM';
  if (rating < 1400) return 'PM';
  if (rating < 1600) return 'Senior PM';
  if (rating < 1800) return 'Staff PM';
  if (rating < 2000) return 'Principal PM';
  return 'Legendary PM';
}

/**
 * Get color for rating band
 */
export function getRatingColor(rating: number): string {
  if (rating < 1000) return 'text-gray-500';
  if (rating < 1200) return 'text-blue-500';
  if (rating < 1400) return 'text-green-500';
  if (rating < 1600) return 'text-purple-500';
  if (rating < 1800) return 'text-orange-500';
  if (rating < 2000) return 'text-red-500';
  return 'text-yellow-500';
}