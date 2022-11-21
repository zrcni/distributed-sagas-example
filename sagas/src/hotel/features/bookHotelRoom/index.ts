import { IHotelRoomReservation } from "@/hotel/HotelRoomReservation"
import { HotelService } from "@/hotel/HotelService"
import { InMemoryKeyValueStore } from "@/store/InMemoryKeyValueStore"
import { BookHotelRoomController } from "./BookHotelRoomController"

export const hotelStore = new InMemoryKeyValueStore<IHotelRoomReservation>()
export const hotelService = new HotelService(hotelStore)

export const bookHotelRoomController = new BookHotelRoomController(hotelService)
