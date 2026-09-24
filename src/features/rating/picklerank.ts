/**
 * PickleRank Algorithm (Phase 5)
 *
 * An isolated module for calculating player ratings.
 * Uses an Elo-based approach adapted for Pickleball doubles and singles.
 * See AGENTS.md §8: Never claim equivalence to DUPR.
 */

export const PICKLERANK_BASE = 3.500 // Default starting rating
export const PICKLERANK_K_FACTOR = 0.1 // Max rating change per match

interface RatingResult {
  newRatingA: number
  newRatingB: number
  ratingChangeA: number
  ratingChangeB: number
}

export const pickleRank = {
  /**
   * Calculate the expected probability of Team A winning against Team B.
   */
  getExpectedScore(ratingA: number, ratingB: number): number {
    // Standard Elo formula adjusted for PickleRank scale
    // Usually Elo uses 400 as the scaling factor. We use 1.0 for a tighter distribution.
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 1.0))
  },

  /**
   * Calculate new ratings for a 1v1 match.
   */
  calculateSinglesMatch(
    ratingA: number,
    ratingB: number,
    scoreA: number,
    scoreB: number
  ): RatingResult {
    const expectedA = this.getExpectedScore(ratingA, ratingB)
    const expectedB = 1 - expectedA

    // Actual outcome (1 for win, 0 for loss)
    const actualA = scoreA > scoreB ? 1 : 0
    const actualB = scoreB > scoreA ? 1 : 0

    // Point differential multiplier (rewards decisive wins)
    const pointDiff = Math.abs(scoreA - scoreB)
    const marginMultiplier = Math.log(pointDiff + 1) / 2 // Soft cap on blowout impact

    const changeA = PICKLERANK_K_FACTOR * marginMultiplier * (actualA - expectedA)
    const changeB = PICKLERANK_K_FACTOR * marginMultiplier * (actualB - expectedB)

    return {
      newRatingA: Math.max(1.0, ratingA + changeA),
      newRatingB: Math.max(1.0, ratingB + changeB),
      ratingChangeA: changeA,
      ratingChangeB: changeB,
    }
  },

  /**
   * Calculate new ratings for a 2v2 match.
   * Treats a doubles team's rating as the average of the two players.
   */
  calculateDoublesMatch(
    teamA: [number, number],
    teamB: [number, number],
    scoreA: number,
    scoreB: number
  ) {
    const avgRatingA = (teamA[0] + teamA[1]) / 2
    const avgRatingB = (teamB[0] + teamB[1]) / 2

    const result = this.calculateSinglesMatch(avgRatingA, avgRatingB, scoreA, scoreB)

    // Apply the team's rating change equally to both players
    return {
      newRatingA1: Math.max(1.0, teamA[0] + result.ratingChangeA),
      newRatingA2: Math.max(1.0, teamA[1] + result.ratingChangeA),
      newRatingB1: Math.max(1.0, teamB[0] + result.ratingChangeB),
      newRatingB2: Math.max(1.0, teamB[1] + result.ratingChangeB),
      ratingChangeA: result.ratingChangeA,
      ratingChangeB: result.ratingChangeB,
    }
  },

  /**
   * Formats a rating for display (e.g., 3.524 -> "3.52")
   */
  format(rating: number): string {
    return rating.toFixed(2)
  }
}
