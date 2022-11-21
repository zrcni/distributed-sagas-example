import { hotelService } from "@/hotel"
import { CreateHotelRoomController } from "./CreateHotelRoomController"

export const createHotelRoomController = new CreateHotelRoomController(
  hotelService
)
