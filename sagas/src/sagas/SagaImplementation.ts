import { SagaDefinition } from "./saga-definition/SagaDefinition"

export abstract class SagaImplementation {
  protected abstract sagaDefinition: SagaDefinition

  getSagaDefinition() {
    return this.sagaDefinition
  }
}
