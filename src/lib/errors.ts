export class PaymentError extends Error {
  public code: string
  public details: Record<string, any>

  constructor(message: string, code: string, details: Record<string, any> = {}) {
    super(message)
    this.name = 'PaymentError'
    this.code = code
    this.details = details
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      }
    }
  }
}
