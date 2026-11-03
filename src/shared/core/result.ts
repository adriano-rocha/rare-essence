/**
 * Implementação funcional do padrão Result (Success | Failure).
 * Garante tipagem estrita de retorno sem necessidade de throw/catch no fluxo normal de negócio.
 */
export class Result<S, E> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value: S | null,
    private readonly _error: E | null
  ) {
    Object.freeze(this);
  }

  public isSuccess(): boolean {
    return this._isSuccess;
  }

  public isFailure(): boolean {
    return !this._isSuccess;
  }

  public get value(): S | null {
    return this._value;
  }

  public get error(): E | null {
    return this._error;
  }

  public static ok<S, E = unknown>(value: S): Result<S, E> {
    return new Result<S, E>(true, value, null);
  }

  public static fail<S = unknown, E = unknown>(error: E): Result<S, E> {
    return new Result<S, E>(false, null, error);
  }
}