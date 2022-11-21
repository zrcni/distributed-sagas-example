import { logger } from "@/logger"
import { SagaDefinition } from "@/sagas/saga-definition/SagaDefinition"
import { Saga } from "./Saga"
import { EndStep, SagaStep, StartStep } from "./saga-definition/SagaStep"

type ErrorHandler = (err: Error) => void

export class SagaRunner {
  saga: Saga
  sagaDefinition: SagaDefinition
  currentStepIndex: number
  handleError: ErrorHandler

  constructor(saga: Saga, sagaDefinition: SagaDefinition) {
    this.saga = saga
    this.sagaDefinition = sagaDefinition
    this.handleError = () => {}
  }

  onError(handleError: (err: Error) => void) {
    this.handleError = handleError
  }

  getCurrentStep(): SagaStep | null {
    return this.sagaDefinition.steps[this.currentStepIndex] ?? null
  }

  incrementStep() {
    this.currentStepIndex += 1
  }

  async run() {
    if (await this.saga.isSagaCompleted()) {
      return
    }
    if (await this.saga.isSagaAborted()) {
      return this.compensate()
    }

    await this.initialize()

    const data = await this.saga.getJob()
    try {
      await this.iterate(data)
    } catch (err) {
      logger.info(
        `Failed to run task ${this.getCurrentStep().taskName}. Aborting saga...`
      )
      this.handleError(err)
      await this.saga.abortSaga()
      await this.compensate()
    }
  }

  async initialize() {
    this.currentStepIndex = -1

    for (const step of this.sagaDefinition.steps) {
      this.currentStepIndex += 1

      if (step instanceof StartStep) {
        continue
      }
      if (step instanceof EndStep) {
        break
      }

      if (!(await this.saga.isTaskStarted(step.taskName))) {
        break
      }
    }
  }

  async iterate(data: unknown) {
    const step = this.getCurrentStep()

    if (step instanceof StartStep) {
      this.incrementStep()
      return this.iterate(data)
    }

    if (step instanceof EndStep) {
      logger.info(`Ending saga`)
      const endSagaResult = await this.saga.endSaga()
      if (endSagaResult.isError()) {
        throw endSagaResult.data
      }
      logger.info(`Saga ended`)
      return
    }

    const startTaskResult = await this.saga.startTask(step.taskName)
    if (startTaskResult.isError()) {
      throw startTaskResult.data
    }

    logger.info(`Running task ${step.taskName}`)
    const result = await step.invokeCallback(data)
    const endTaskResult = await this.saga.endTask(step.taskName, result)

    if (endTaskResult.isError()) {
      throw endTaskResult.data
    }

    logger.info(`Ended task ${step.taskName}`)
    this.incrementStep()
    return this.iterate(data)
  }

  async compensate() {
    const data = await this.saga.getJob()

    for (let i = this.sagaDefinition.steps.length - 1; i >= 0; i--) {
      const step = this.sagaDefinition.steps[i]

      if (await this.saga.isTaskCompleted(step.taskName)) {
        const taskData = await this.saga.getStartTaskData(step.taskName)
        await this.saga.startCompensatingTask(step.taskName, taskData)
        logger.info(`Compensating task ${step.taskName}`)

        const result = await step.compensateCallback(data)
        logger.info(`Compensated task ${step.taskName}`)
        await this.saga.endCompensatingTask(step.taskName, result)
      }
    }
  }
}
