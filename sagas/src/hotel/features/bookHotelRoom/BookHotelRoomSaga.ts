import { HotelService } from "@/hotel/HotelService"
import { start } from "@/sagas/saga-definition"

type BookHotelRoomSagaData = {
  roomId: string
  amount: number
  username: string
}

export class BookHotelRoomSaga {
  private sagaDefinition = start()
    .invoke(this.reserveRoom)
    .compensate(this.releaseRoom)
    .withName("reserve-room")
    .step()
    .invoke(this.requestPayment)
    .compensate(this.refundPayment)
    .withName("request-payment")
    .end()

  private hotelService: HotelService

  constructor(hotelService: HotelService) {
    this.hotelService = hotelService

    this.reserveRoom = this.reserveRoom.bind(this)
    this.releaseRoom = this.releaseRoom.bind(this)
    this.requestPayment = this.requestPayment.bind(this)
    this.refundPayment = this.refundPayment.bind(this)
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

  releaseRoom(data: BookHotelRoomSagaData) {}

  requestPayment(data: BookHotelRoomSagaData) {}

  refundPayment(data: BookHotelRoomSagaData) {}
}
