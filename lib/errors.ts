export class AIServiceError extends Error {
  provider: string;
  isRetryable: boolean;

  constructor(message: string, provider: string, isRetryable: boolean = false) {
    super(message);
    this.name = 'AIServiceError';
    this.provider = provider;
    this.isRetryable = isRetryable;
  }
}
