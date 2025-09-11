import mongoose from "mongoose";

/**
 * Transaction wrapper with retry mechanism
 * @param {Function} fn - async function to run inside transaction (receives session)
 * @param {number} maxRetries - how many times to retry on transient errors
 */
export async function withTransaction(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const result = await fn(session);

      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();

      // Retry if transient error
      if (
        attempt < maxRetries &&
        (err.errorLabels?.includes("TransientTransactionError") ||
          err.errorLabels?.includes("UnknownTransactionCommitResult"))
      ) {
        console.warn(
          `⚠️ Transaction attempt ${attempt} failed, retrying...`,
          err.message
        );
        continue; // try again
      }

      throw err; // permanent error or retries exhausted
    } finally {
      session.endSession();
    }
  }
}
