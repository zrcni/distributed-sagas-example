import { Request } from "express"
import { HttpController } from "@/server/HttpController"
import { HotelService } from "@/hotel/HotelService"
import { ConflictError } from "@/errors"
import { ChannelPublisher } from "@/channel/Channel"
import { BookHotelRoomMessagePayload } from "./types"

export class BookHotelRoomController extends HttpController {
  private hotelService: HotelService
  private sagaChannel: ChannelPublisher

  constructor(hotelService: HotelService, sagaChannel: ChannelPublisher) {
    super()
    this.hotelService = hotelService
    this.sagaChannel = sagaChannel
  }

  // todo params take from request body
  async exec() {
    const roomId = "room-1"
    const username = "user-1"
    const amount = 500

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
      amount,
    }

    this.sagaChannel.publish(message)

    return this.noContent()
  }
}
