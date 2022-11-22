import { IHotelRoomReservation } from "@/hotel/HotelRoomReservation"
import { HotelService } from "@/hotel/HotelService"
import { PaymentService } from "@/payment/PaymentService"
import { RequestPaymentResult } from "@/payment/types"
import { start } from "@/sagas/saga-definition"
import { SagaImplementation } from "@/sagas/SagaImplementation"
import { BookHotelRoomSagaData, ReserveHotelRoomResult } from "./types"

export class BookHotelRoomSaga extends SagaImplementation {
  static tasks = {
    ReserveRoom: "reserve-room",
    RequestPayment: "request-payment",
  }

  protected sagaDefinition = start()
    .invoke(this.reserveRoom.bind(this))
    .compensate(this.releaseRoom.bind(this))
    .withName(BookHotelRoomSaga.tasks.ReserveRoom)
    .next()
    .invoke(this.requestPayment.bind(this))
    .compensate(this.refundPayment.bind(this))
    .withName(BookHotelRoomSaga.tasks.RequestPayment)
    .end()

  private hotelService: HotelService
  private paymentService: PaymentService

  constructor(hotelService: HotelService, paymentService: PaymentService) {
    super()
    this.hotelService = hotelService
    this.paymentService = paymentService
  }

  private async reserveRoom(
    data: BookHotelRoomSagaData
  ): Promise<ReserveHotelRoomResult> {
    const result = await this.hotelService.reserveRoom(
      data.roomId,
      data.username
    )

    if (result.isError()) {
      const error = result.data
      throw error
    }

    const reservation = result.data
    return reservation.toJSON()
  }

  private async releaseRoom(
    _data: BookHotelRoomSagaData,
    prevResult: IHotelRoomReservation
  ): Promise<boolean> {
    const result = await this.hotelService.releaseRoom(
      prevResult.confirmationNumber
    )
    if (result.isError()) {
      const error = result.data
      throw error
    }
    return true
  }

  private async requestPayment(
    data: BookHotelRoomSagaData,
    prevResult: IHotelRoomReservation
  ): Promise<RequestPaymentResult> {
    const result = await this.paymentService.requestPayment(
      prevResult.confirmationNumber,
      prevResult.username,
      data.amount
    )

    if (result.isError()) {
      const error = result.data
      throw error
    }

    return result.data
  }

  private async refundPayment(
    _data: BookHotelRoomSagaData,
    prevResult: RequestPaymentResult
  ): Promise<boolean> {
    const result = await this.paymentService.refundPayment(
      prevResult.invoiceNumber
    )
    if (result.isError()) {
      const error = result.data
      throw error
    }
    return true
  }
}
