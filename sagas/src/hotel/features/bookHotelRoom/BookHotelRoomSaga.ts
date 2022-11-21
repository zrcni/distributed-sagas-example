import { IHotelRoomReservation } from "@/hotel/HotelRoomReservation"
import { HotelService } from "@/hotel/HotelService"
import { PaymentService } from "@/payment/PaymentService"
import { RequestPaymentResult } from "@/payment/types"
import { start } from "@/sagas/saga-definition"
import { BookHotelRoomSagaData } from "./types"

export class BookHotelRoomSaga {
  private sagaDefinition = start()
    .invoke(this.reserveRoom.bind(this))
    .compensate(this.releaseRoom.bind(this))
    .withName("reserve-room")
    .step()
    .invoke(this.requestPayment.bind(this))
    .compensate(this.refundPayment.bind(this))
    .withName("request-payment")
    .end()

  private hotelService: HotelService
  private paymentService: PaymentService

  constructor(hotelService: HotelService, paymentService: PaymentService) {
    this.hotelService = hotelService
    this.paymentService = paymentService
  }

  getSagaDefinition() {
    return this.sagaDefinition
  }

  async reserveRoom(data: BookHotelRoomSagaData) {
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

  async releaseRoom(
    _data: BookHotelRoomSagaData,
    prevResult: IHotelRoomReservation
  ) {
    const result = await this.hotelService.releaseRoom(
      prevResult.confirmationNumber
    )
    if (result.isError()) {
      const error = result.data
      throw error
    }
    return true
  }

  async requestPayment(
    data: BookHotelRoomSagaData,
    prevResult: IHotelRoomReservation
  ) {
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

  async refundPayment(
    _data: BookHotelRoomSagaData,
    prevResult: RequestPaymentResult
  ) {
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
