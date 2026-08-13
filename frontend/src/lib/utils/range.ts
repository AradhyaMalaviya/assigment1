import type { RecipientRangeInput, ComputedRecipientRange } from '$lib/types/forms';

/**
 * Computes 0-based start index and 1-based count for the backend API based on user range selection.
 * User inputs (rangeStart, rangeEnd) are 1-based row numbers.
 */
export function computeRecipientRange(
  input: RecipientRangeInput,
  totalContacts: number
): ComputedRecipientRange {
  if (totalContacts <= 0) {
    return {
      start: 0,
      count: 0,
      end: 0,
      isValid: false,
      errorMessage: 'No valid contacts available to select.'
    };
  }

  if (input.mode === 'all') {
    return {
      start: 0,
      count: totalContacts,
      end: totalContacts,
      isValid: true
    };
  }

  if (input.mode === 'first') {
    const count = input.firstCount ?? 0;
    if (!Number.isInteger(count) || count < 1) {
      return {
        start: 0,
        count: 0,
        end: 0,
        isValid: false,
        errorMessage: 'Please enter a valid positive number of contacts.'
      };
    }
    if (count > totalContacts) {
      return {
        start: 0,
        count,
        end: count,
        isValid: false,
        errorMessage: `First N contacts (${count}) exceeds total available contacts (${totalContacts}).`
      };
    }
    return {
      start: 0,
      count,
      end: count,
      isValid: true
    };
  }

  if (input.mode === 'custom') {
    const startRow = input.rangeStart ?? 0;
    const endRow = input.rangeEnd ?? 0;

    if (!Number.isInteger(startRow) || startRow < 1) {
      return {
        start: 0,
        count: 0,
        end: endRow,
        isValid: false,
        errorMessage: 'Start row must be a positive integer (at least 1).'
      };
    }

    if (!Number.isInteger(endRow) || endRow < 1) {
      return {
        start: startRow - 1,
        count: 0,
        end: 0,
        isValid: false,
        errorMessage: 'End row must be a positive integer (at least 1).'
      };
    }

    if (startRow > endRow) {
      return {
        start: startRow - 1,
        count: 0,
        end: endRow,
        isValid: false,
        errorMessage: `Start row (${startRow}) cannot be greater than end row (${endRow}).`
      };
    }

    if (endRow > totalContacts) {
      return {
        start: startRow - 1,
        count: endRow - startRow + 1,
        end: endRow,
        isValid: false,
        errorMessage: `End row (${endRow}) exceeds total available contacts (${totalContacts}).`
      };
    }

    const count = endRow - startRow + 1;
    return {
      start: startRow - 1, // 0-based
      count,               // 1-based count
      end: endRow,
      isValid: true
    };
  }

  return {
    start: 0,
    count: totalContacts,
    end: totalContacts,
    isValid: true
  };
}
