import { ResultError, ResultOk } from "./Result"
import { SagaMessage } from "./sagas/SagaMessage"

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOkResult(): R
    }
  }
}

export interface SagaLog {
  startSaga<D>(sagaId: string, job: D): Promise<ResultOk | ResultError>
  logMessage(msg: SagaMessage): Promise<ResultOk | ResultError>
  getMessages(sagaId: string): Promise<ResultOk<SagaMessage[]> | ResultError>
  getActiveSagaIds(): Promise<ResultOk<string[]> | ResultError>
}
