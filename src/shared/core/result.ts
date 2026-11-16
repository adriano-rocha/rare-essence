export interface Success<S, E> {
  readonly kind: 'success';
  readonly value: S;
  readonly error?: never;
  isSuccess(): boolean;
  isFailure(): boolean;
}

export interface Failure<S, E> {
  readonly kind: 'failure';
  readonly value?: never;
  readonly error: E;
  isSuccess(): boolean;
  isFailure(): boolean;
}

export type Result<S, E> = Success<S, E> | Failure<S, E>;

export const Result = {
  ok<S, E = never>(value: S): Success<S, E> {
    return Object.freeze({
      kind: 'success' as const,
      value,
      error: undefined,
      isSuccess: () => true,
      isFailure: () => false,
    });
  },

  fail<S = never, E = unknown>(error: E): Failure<S, E> {
    return Object.freeze({
      kind: 'failure' as const,
      value: undefined,
      error,
      isSuccess: () => false,
      isFailure: () => true,
    });
  },
};
