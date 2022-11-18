import ms from "ms"
import { CancelablePromise } from "cancelable-promise"
import EventEmitter from "events"
import { SagaMessage, SagaMessageType } from "./SagaMessage"
import { SagaState } from "./SagaState"
import { validateSagaUpdate } from "./saga-state-update"
import { Result, ResultError, ResultOk } from "@/Result"
import { timeout } from "@/utils"
import { SagaLog } from "./types"

export class Saga {
  sagaId: string
  state: SagaState
  log: SagaLog
  loopPromise?: CancelablePromise
  emitter: EventEmitter

  constructor(sagaId: string, state: SagaState, log: SagaLog) {
    this.sagaId = sagaId
    this.state = state
    this.log = log
    this.emitter = new EventEmitter()
  }

  async getJob() {
    return this.state.job
  }

  async getTaskIds() {
    return this.state.getTaskIds()
  }

  async isTaskStarted(taskId: string) {
    return this.state.isTaskStarted(taskId)
  }

  async getStartTaskData(taskId: string) {
    return this.state.getStartTaskData(taskId)
  }

  async isTaskCompleted(taskId: string) {
    return this.state.isTaskCompleted(taskId)
  }

  async getEndTaskData(taskId: string) {
    return this.state.getEndTaskData(taskId)
  }

  async isCompensatingTaskStarted(taskId: string) {
    return this.state.isCompensatingTaskStarted(taskId)
  }

  async getStartCompensatingTaskData(taskId: string) {
    return this.state.getStartCompensatingTaskData(taskId)
  }

  async isCompensatingTaskCompleted(taskId: string) {
    return this.state.isCompensatingTaskCompleted(taskId)
  }

  async getEndCompensatingTaskData(taskId: string) {
    return this.state.getEndCompensatingTaskData(taskId)
  }

  async isSagaAborted() {
    return this.state.isSagaAborted()
  }

  async isSagaCompleted() {
    return this.state.isSagaCompleted()
  }

  async endSaga() {
    return this.updateSagaState(SagaMessage.createEndSagaMessage(this.sagaId))
  }

  async abortSaga() {
    return this.updateSagaState(SagaMessage.createAbortSagaMessage(this.sagaId))
  }

  async startTask<D = unknown>(taskId: string, data: D) {
    return this.updateSagaState(
      SagaMessage.createStartTaskMessage(this.sagaId, taskId, data)
    )
  }

  async endTask<R = unknown>(taskId: string, result: R) {
    return this.updateSagaState(
      SagaMessage.createEndTaskMessage(this.sagaId, taskId, result)
    )
  }

  async startCompensatingTask<D = unknown>(taskId: string, data: D) {
    return this.updateSagaState(
      SagaMessage.createStartCompensatingTaskMessage(this.sagaId, taskId, data)
    )
  }

  async endCompensatingTask<R = unknown>(taskId: string, result: R) {
    return this.updateSagaState(
      SagaMessage.createEndCompensatingTaskMessage(this.sagaId, taskId, result)
    )
  }

  async logMessage(msg: SagaMessage) {
    const error = validateSagaUpdate(this.state, msg)
    if (error) {
      return Result.error(error)
    }

    const result = await this.log.logMessage(msg)
    if (result.isError()) {
      return result
    }

    await this.updateSagaState(msg)

    return Result.ok()
  }

  async updateSagaState(msg: SagaMessage): Promise<Result> {
    const result = await addMessage(this.emitter, msg)

    if (result.isError()) {
      return result
    }

    if (msg.msgType === SagaMessageType.EndSaga) {
      this.loopPromise?.cancel()
    }

    return Result.ok()
  }

  updateSagaStateLoop() {
    this.loopPromise = new CancelablePromise(
      async (_resolve, _reject, onCancel) => {
        this.emitter.on("message", this.handleUpdate)

        onCancel(() => {
          this.emitter.off("message", this.handleUpdate)
        })
      }
    )
  }

  async handleUpdate(msg: SagaMessage) {
    const result = await this.logMessage(msg)
    this.emitter.emit(`message:${msg.taskId}`, result)
  }

  static async rehydrateSaga(sagaId: string, state: SagaState, log: SagaLog) {
    const saga = new Saga(sagaId, state, log)

    if (!state.isSagaCompleted()) {
      saga.updateSagaStateLoop()
    }

    return saga
  }

  static async create<D>(
    sagaId: string,
    job: D,
    log: SagaLog
  ): Promise<ResultOk | ResultError> {
    const sagaState = SagaState.create(sagaId, job)

    const result = await log.startSaga(sagaId, job)
    if (result.isError()) {
      return result
    }

    const saga = new Saga(sagaId, sagaState, log)

    saga.updateSagaStateLoop()

    return Result.ok(saga)
  }
}

function addMessage(emitter: EventEmitter, msg: SagaMessage) {
  const promise = timeout(
    new Promise<Result>((resolve) => {
      emitter.once(`message:${msg.taskId}`, resolve)
    }),
    ms("5s")
  )

  emitter.emit("message", msg)

  return promise
}
