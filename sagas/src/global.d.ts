export {}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOkResult(): R
      toBeErrorResult(): R
    }
  }
}
