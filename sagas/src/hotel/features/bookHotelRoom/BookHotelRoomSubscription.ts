import { Channel } from "@/channel/Channel"
import { HotelService } from "@/hotel/HotelService"
import { PaymentService } from "@/payment/PaymentService"
import { RequestPaymentResult } from "@/payment/types"
import { SagaCoordinator } from "@/sagas/SagaCoordinator"
import { SagaRunner } from "@/sagas/SagaRunner"
import { BookHotelRoomSaga } from "./BookHotelRoomSaga"
import {
  BookHotelRoomFailedMessagePayload,
  BookHotelRoomMessagePayload,
  BookHotelRoomSagaData,
  HotelRoomBookedMessagePayload,
  ReserveHotelRoomResult,
} from "./types"

export class BookHotelRoomSubscription {
  inChannel: Channel
  outChannel: Channel
  sagaCoordinator: SagaCoordinator
  hotelService: HotelService
  paymentService: PaymentService

  constructor(
    inChannel: Channel,
    outChannel: Channel,
    sagaCoordinator: SagaCoordinator,
    hotelService: HotelService,
    paymentService: PaymentService
  ) {
    this.inChannel = inChannel
    this.outChannel = outChannel
    this.sagaCoordinator = sagaCoordinator
    this.hotelService = hotelService
    this.paymentService = paymentService
  }

  start() {
    this.inChannel.subscribe<BookHotelRoomMessagePayload>(
      this.handleMessage.bind(this)
    )
  }

  private async handleMessage(payload: BookHotelRoomMessagePayload) {
    const sagaId = `book-hotel-room:${payload.data.roomId}:${payload.data.username}`
    const result = await this.sagaCoordinator.createSaga<BookHotelRoomSagaData>(
      sagaId,
      {
        roomId: payload.data.roomId,
        username: payload.data.username,
        amount: payload.data.amount,
      }
    )

    if (result.isError()) {
      return this.outChannel.publish<BookHotelRoomFailedMessagePayload>({
        eventName: "book-hotel-room-failed",
        data: {
          roomId: payload.data.roomId,
          username: payload.data.username,
          reason: result.data.message,
        },
      })
    }

    const bookHotelRoomSaga = new BookHotelRoomSaga(
      this.hotelService,
      this.paymentService
    ).getSagaDefinition()

    let error: Error

    const saga = await new SagaRunner<BookHotelRoomSagaData>(
      result.data,
      bookHotelRoomSaga
    )
      // TODO add abort reason to saga?
      .onError((err) => {
        error = err
      })
      .run()

    if (await saga.isSagaCompleted()) {
      const data = await saga.getJob()

      const reserveRoomResult =
        await saga.getEndTaskData<ReserveHotelRoomResult>(
          BookHotelRoomSaga.tasks.ReserveRoom
        )

      const requestPaymentResult =
        await saga.getEndTaskData<RequestPaymentResult>(
          BookHotelRoomSaga.tasks.RequestPayment
        )

      this.outChannel.publish<HotelRoomBookedMessagePayload>({
        eventName: "hotel-room-booked",
        data: {
          amount: data.amount,
          roomId: data.roomId,
          username: data.username,
          invoiceNumber: requestPaymentResult.invoiceNumber,
          confirmationNumber: reserveRoomResult.confirmationNumber,
        },
      })
    }

    if (await saga.isSagaAborted()) {
      const data = await saga.getJob()

      this.outChannel.publish<BookHotelRoomFailedMessagePayload>({
        eventName: "book-hotel-room-failed",
        data: {
          roomId: data.roomId,
          username: data.username,
          reason: error.message,
        },
      })
    }
  }
}
