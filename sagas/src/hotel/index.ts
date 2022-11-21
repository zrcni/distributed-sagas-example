import { InMemoryKeyValueStore } from "@/store/InMemoryKeyValueStore"
import { IHotelRoom } from "./HotelRoom"
import { IHotelRoomReservation } from "./HotelRoomReservation"
import { HotelService } from "./HotelService"

export const reservationStore =
  new InMemoryKeyValueStore<IHotelRoomReservation>()

export const roomStore = new InMemoryKeyValueStore<IHotelRoom>()

export const hotelService = new HotelService(reservationStore, roomStore)
