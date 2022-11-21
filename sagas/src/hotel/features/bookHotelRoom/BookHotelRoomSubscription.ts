import { Channel } from "@/channel/Channel"
import { HotelService } from "@/hotel/HotelService"
import { PaymentService } from "@/payment/PaymentService"
import { RequestPaymentResult } from "@/payment/types"
import { SagaCoordinator } from "@/sagas/SagaCoordinator"
import { SagaRunner } from "@/sagas/SagaRunner"
import { BookHotelRoomSaga } from "./BookHotelRoomSaga"
import {
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
    const sagaId = `book-hotel-room:${payload.roomId}:${payload.username}`
    const result = await this.sagaCoordinator.createSaga<BookHotelRoomSagaData>(
      sagaId,
      {
        roomId: payload.roomId,
        username: payload.username,
        amount: payload.amount,
      }
    )

    if (result.isError()) {
      // WHAT DO
      return
    }

    const bookHotelRoomSaga = new BookHotelRoomSaga(
      this.hotelService,
      this.paymentService
    ).getSagaDefinition()

    const saga = await new SagaRunner<BookHotelRoomSagaData>(
      result.data,
      bookHotelRoomSaga
    )
      // what do
      .onError((err) => {
        console.error(err)
      })
      .run()

    if (await saga.isSagaCompleted()) {
      const data = await saga.getJob()
      const reserveRoomResult =
        await saga.getEndTaskData<ReserveHotelRoomResult>("reserve-room")
      const requestPaymentResult =
        await saga.getEndTaskData<RequestPaymentResult>("request-payment")

      this.outChannel.publish<HotelRoomBookedMessagePayload>({
        amount: data.amount,
        roomId: data.roomId,
        username: data.username,
        invoiceNumber: requestPaymentResult.invoiceNumber,
        confirmationNumber: reserveRoomResult.confirmationNumber,
      })
    }
  }
}
