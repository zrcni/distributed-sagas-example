import { Request } from "express"
import { HttpController } from "@/server/HttpController"
import { HotelService } from "@/hotel/HotelService"
import { ConflictError, NotFoundError, ValidationError } from "@/errors"
import { ChannelPublisher } from "@/channel/Channel"
import { BookHotelRoomMessagePayload } from "./types"

type BookHotelRoomRequest = Request<
  { room_id: string },
  undefined,
  { username: string }
>

export class BookHotelRoomController extends HttpController {
  private hotelService: HotelService
  private sagaChannel: ChannelPublisher

  constructor(hotelService: HotelService, sagaChannel: ChannelPublisher) {
    super()
    this.hotelService = hotelService
    this.sagaChannel = sagaChannel
  }

  async exec(req: BookHotelRoomRequest) {
    const roomId = req.params.room_id
    const username = req.body.username

    if (!username) {
      return this.error(new ValidationError("username is required"))
    }

    const getHotelRoomResult = await this.hotelService.getRoom(roomId)
    if (getHotelRoomResult.isError()) {
      return this.error(getHotelRoomResult.data)
    }

    const hotelRoom = getHotelRoomResult.data

    if (!hotelRoom) {
      return this.error(
        new NotFoundError("room does not exist", {
          roomId,
        })
      )
    }

    const result = await this.hotelService.getReservation(roomId)
    if (result.isError()) {
      return this.error(result.data)
    }

    const reservation = result.data

    if (reservation) {
      // idempotency
      if (reservation.username === username) {
        return this.ok(reservation.confirmationNumber)
      }

      return this.error(
        new ConflictError("room has already been reserved by another user", {
          roomId,
        })
      )
    }

    const message: BookHotelRoomMessagePayload = {
      eventName: "book-hotel-room",
      roomId,
      username,
      amount: hotelRoom.priceAmount,
    }

    this.sagaChannel.publish(message)

    return this.noContent()
  }
}
