import { Result } from "@/Result"
import {
  InvalidSagaMessageError,
  InvalidSagaStateError,
  InvalidSagaStateUpdateError,
} from "../errors"
import { SagaMessage, SagaMessageType } from "./SagaMessage"
import { SagaState, TaskStatus } from "./SagaState"

export function validateSagaUpdate(
  state: SagaState,
  msg: SagaMessage
): Error | null {
  if (msg.sagaId !== state.sagaId) {
    return new InvalidSagaMessageError(
      `sagaId ${state.sagaId} and SagaMessage ${msg.sagaId} do not match`,
      {
        messageSagaId: msg.sagaId,
        stateSagaId: state.sagaId,
      }
    )
  }

  switch (msg.msgType) {
    case SagaMessageType.StartSaga: {
      return new InvalidSagaStateError(
        "Cannot apply a StartSaga message to an already existing saga",
        {
          sagaId: msg.sagaId,
        }
      )
    }

    case SagaMessageType.EndSaga: {
      for (const taskId in state.taskStatus) {
        if (state.isSagaAborted()) {
          if (
            !state.isCompensatingTaskStarted(taskId) ||
            !state.isCompensatingTaskCompleted(taskId)
          ) {
            return new InvalidSagaStateError(
              `EndSaga message cannot be applied to an aborted saga where Task ${taskId} has not completed its compensating tasks`,
              { taskId, sagaId: msg.sagaId }
            )
          }
        } else {
          if (!state.isTaskCompleted(taskId)) {
            return new InvalidSagaStateError(
              `EndSaga message cannot be applied to a saga where task ${taskId} has not completed`,
              { taskId, sagaId: msg.sagaId }
            )
          }
        }
      }
    }

    case SagaMessageType.AbortSaga: {
      if (state.isSagaCompleted()) {
        return new InvalidSagaStateError(
          "AbortSaga message cannot be applied to a completed saga",
          {
            sagaId: msg.sagaId,
          }
        )
      }
    }

    case SagaMessageType.StartTask: {
      if (state.isSagaCompleted()) {
        return new InvalidSagaStateError(
          "Cannot StartTask after saga has already been completed",
          {
            sagaId: msg.sagaId,
          }
        )
      }

      if (state.isSagaAborted()) {
        return new InvalidSagaStateError(
          "Cannot StartTask after it has been aborted",
          {
            sagaId: msg.sagaId,
          }
        )
      }

      if (state.isTaskCompleted(msg.taskId)) {
        return new InvalidSagaStateError(
          "Cannot StartTask after it has been completed",
          {
            sagaId: msg.sagaId,
            taskId: msg.taskId,
          }
        )
      }
    }

    case SagaMessageType.EndTask: {
      if (state.isSagaCompleted()) {
        return new InvalidSagaStateError(
          "Cannot EndTask after saga has been completed",
          {
            sagaId: msg.sagaId,
          }
        )
      }

      if (state.isSagaAborted()) {
        return new InvalidSagaStateError(
          "Cannot EndTask after saga as been aborted"
        )
      }

      if (!state.isTaskStarted(msg.taskId)) {
        return new InvalidSagaStateError(
          "Cannot EndTask before task has started",
          {
            msg: msg.taskId,
            sagaId: msg.sagaId,
          }
        )
      }
    }

    case SagaMessageType.StartCompensatingTask: {
      if (state.isSagaCompleted()) {
        return new InvalidSagaStateError(
          "Cannot StartCompensatingTask after saga has been completed",
          {
            sagaId: msg.sagaId,
          }
        )
      }

      if (!state.isSagaAborted()) {
        return new InvalidSagaStateError(
          "Cannot StartCompensatingTask when saga has not been aborted",
          {
            taskId: msg.taskId,
            sagaId: msg.sagaId,
          }
        )
      }

      if (!state.isTaskStarted(msg.taskId)) {
        return new InvalidSagaStateError(
          "Cannot StartCompensatingTask when task has not started",
          {
            taskId: msg.taskId,
            sagaId: msg.sagaId,
          }
        )
      }

      if (state.isCompensatingTaskCompleted(msg.taskId)) {
        return new InvalidSagaStateError(
          "Cannot StartCompensatingTask after it has been completed",
          {
            taskId: msg.taskId,
            sagaId: msg.sagaId,
          }
        )
      }
    }

    case SagaMessageType.EndCompensatingTask: {
      if (state.isSagaCompleted()) {
        return new InvalidSagaStateError(
          "Cannot EndCompensatingTask after saga has been completed",
          {
            sagaId: msg.sagaId,
          }
        )
      }

      if (!state.isSagaAborted()) {
        return new InvalidSagaStateError(
          "Cannot EndCompensatingTask when saga has not been aborted",
          {
            sagaId: msg.sagaId,
          }
        )
      }

      if (!state.isTaskStarted(msg.taskId)) {
        return new InvalidSagaStateError(
          "Cannot EndCompensatingTask when task has not started",
          {
            taskId: msg.taskId,
            sagaId: msg.sagaId,
          }
        )
      }

      if (!state.isCompensatingTaskStarted(msg.taskId)) {
        return new InvalidSagaStateError(
          "Cannot EndCompensatingTask when task has compensating task has not started",
          {
            taskId: msg.taskId,
            sagaId: msg.sagaId,
          }
        )
      }
    }
  }

  return null
}

export function updateSagaState(state: SagaState, msg: SagaMessage) {
  switch (msg.msgType) {
    case SagaMessageType.StartSaga: {
      return Result.error(
        new InvalidSagaStateUpdateError(
          "Cannot apply StartSaga message to an already existing saga",
          {
            sagaId: msg.sagaId,
          }
        )
      )
    }

    case SagaMessageType.EndSaga: {
      state.sagaCompleted = true
    }

    case SagaMessageType.AbortSaga: {
      state.sagaAborted = true
    }

    case SagaMessageType.StartTask: {
      if (msg.data != null) {
        state.addTaskData(msg.taskId, msg.msgType, msg.data)
      }

      state.taskStatus[msg.taskId] = TaskStatus.TaskStarted
    }

    case SagaMessageType.EndTask: {
      state.taskStatus[msg.taskId] = TaskStatus.TaskCompleted

      if (msg.data != null) {
        state.addTaskData(msg.taskId, msg.msgType, msg.data)
      }
    }

    case SagaMessageType.StartCompensatingTask: {
      state.taskStatus[msg.taskId] = TaskStatus.CompensatingTaskStarted

      if (msg.data != null) {
        state.addTaskData(msg.taskId, msg.msgType, msg.data)
      }
    }

    case SagaMessageType.EndCompensatingTask: {
      if (msg.data != null) {
        state.addTaskData(msg.taskId, msg.msgType, msg.data)
      }

      state.taskStatus[msg.taskId] = TaskStatus.CompensatingTaskCompleted
    }
  }

  return Result.ok()
}
