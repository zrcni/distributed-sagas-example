export type StepInvokeCallback<D = unknown, R = any> = (
  data: D
) => Promise<R> | R
export type StepCompensateCallback<D = unknown, R = any> = (
  data: D
) => Promise<R> | R
