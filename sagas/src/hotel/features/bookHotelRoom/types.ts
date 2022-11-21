import { IHotelRoomReservation } from "@/hotel/HotelRoomReservation"

export type ReserveHotelRoomResult = IHotelRoomReservation

export type BookHotelRoomSagaData = {
  roomId: string
  amount: number
  username: string
}

export type BookHotelRoomMessagePayload = {
  eventName: "book-hotel-room"
  roomId: string
  amount: number
  username: string
}

export type HotelRoomBookedMessagePayload = {
  roomId: string
  amount: number
  username: string
  invoiceNumber: string
  confirmationNumber: string
}
