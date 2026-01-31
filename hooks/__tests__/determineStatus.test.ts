import { determineStatus } from '@/hooks/useProgressiveOverload';

describe('determineStatus', () => {
  it('returns maintaining when lastReps is empty', () => {
    const result = determineStatus([], [], 12, 0);
    expect(result).toEqual({ status: 'maintaining', readyToIncrease: false });
  });

  it('returns progressing + readyToIncrease when all reps hit target max', () => {
    const result = determineStatus([12, 12, 12], [10, 10, 10], 12, 1);
    expect(result).toEqual({ status: 'progressing', readyToIncrease: true });
  });

  it('returns progressing + readyToIncrease when reps exceed target max', () => {
    const result = determineStatus([14, 13, 15], [], 12, 1);
    expect(result).toEqual({ status: 'progressing', readyToIncrease: true });
  });

  it('returns stalled when 3+ sessions at weight with no improvement', () => {
    const result = determineStatus([8, 8, 8], [8, 8, 8], 12, 3);
    expect(result).toEqual({ status: 'stalled', readyToIncrease: false });
  });

  it('returns stalled when 3+ sessions at weight with fewer reps', () => {
    const result = determineStatus([7, 7, 7], [8, 8, 8], 12, 3);
    expect(result).toEqual({ status: 'stalled', readyToIncrease: false });
  });

  it('returns stalled when 3+ sessions at weight with no previous session', () => {
    const result = determineStatus([8, 8, 8], [], 12, 3);
    expect(result).toEqual({ status: 'stalled', readyToIncrease: false });
  });

  it('returns progressing when total reps increased from previous', () => {
    const result = determineStatus([10, 10, 10], [8, 8, 8], 12, 2);
    expect(result).toEqual({ status: 'progressing', readyToIncrease: false });
  });

  it('returns maintaining when total reps equal previous', () => {
    const result = determineStatus([10, 10, 10], [10, 10, 10], 12, 2);
    expect(result).toEqual({ status: 'maintaining', readyToIncrease: false });
  });

  it('returns progressing when 3+ sessions but reps improved', () => {
    const result = determineStatus([10, 10, 10], [8, 8, 8], 12, 3);
    expect(result).toEqual({ status: 'progressing', readyToIncrease: false });
  });

  it('returns maintaining when no previous session and not all at max', () => {
    const result = determineStatus([8, 8, 8], [], 12, 1);
    expect(result).toEqual({ status: 'maintaining', readyToIncrease: false });
  });
});
