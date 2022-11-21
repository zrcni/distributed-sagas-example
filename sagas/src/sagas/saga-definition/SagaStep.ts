import { SagaBuilder } from "./SagaBuilder"
import { StepCompensateCallback, StepInvokeCallback } from "./types"

export class SagaStep {
  private builder: SagaBuilder
  public invokeCallback: StepInvokeCallback
  public compensateCallback: StepCompensateCallback
  public taskName: string

  constructor(builder: SagaBuilder) {
    this.builder = builder
  }

  step() {
    return this.builder.nextStep()
  }

  end() {
    return this.builder.end()
  }

  invoke<D = unknown>(callback: StepInvokeCallback<D>) {
    this.invokeCallback = callback
    if (!this.taskName) {
      this.taskName = callback.name
    }
    return this
  }

  compensate<D = unknown>(callback: StepCompensateCallback<D>) {
    this.compensateCallback = callback
    return this
  }

  withName(name: string) {
    this.taskName = name
    return this
  }
}

export class StartStep extends SagaStep {}
export class EndStep extends SagaStep {}
