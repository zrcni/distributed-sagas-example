import { Request } from "express"
import { HttpController } from "@/server/HttpController"
import { HotelService } from "@/hotel/HotelService"
import { HotelRoomAlreadyExistsError, ValidationError } from "@/errors"

type CreateHotelRoomResult = undefined | { error: Error }

type CreateHotelRoomRequest = Request<
  undefined,
  undefined,
  { roomId: string; priceAmount: number }
>

export class CreateHotelRoomController extends HttpController<CreateHotelRoomResult> {
  private hotelService: HotelService

  constructor(hotelService: HotelService) {
    super()
    this.hotelService = hotelService
  }

  async exec(req: CreateHotelRoomRequest) {
    const roomId = req.body.roomId
    const priceAmount = req.body.priceAmount

    if (roomId == null) {
      return this.error(new ValidationError("roomId is required"))
    }

    if (priceAmount == null) {
      this.error(new ValidationError("priceAmount is required"))
    }

    const getHotelRoomResult = await this.hotelService.getRoom(roomId)
    if (getHotelRoomResult.isError()) {
      return this.error(getHotelRoomResult.data)
    }

    const existingHotelRoom = getHotelRoomResult.data

    if (existingHotelRoom) {
      return this.error(
        new HotelRoomAlreadyExistsError("room already exists", {
          roomId,
        })
      )
    }

    const createRoomResult = await this.hotelService.createRoom(
      roomId,
      priceAmount
    )
    if (createRoomResult.isError()) {
      return this.error(createRoomResult.data)
    }

    return this.noContent()
  }
}
