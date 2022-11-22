import { IHotelRoomReservation } from "@/hotel/HotelRoomReservation"

export type ReserveHotelRoomResult = IHotelRoomReservation

export type BookHotelRoomSagaData = {
  roomId: string
  amount: number
  username: string
}

export type BookHotelRoomMessagePayload = {
  eventName: "book-hotel-room"
  data: {
    roomId: string
    amount: number
    username: string
  }
}

export type HotelRoomBookedMessagePayload = {
  eventName: "hotel-room-booked"
  data: {
    roomId: string
    amount: number
    username: string
    invoiceNumber: string
    confirmationNumber: string
  }
}

export type BookHotelRoomFailedMessagePayload = {
  eventName: "book-hotel-room-failed"
  data: {
    roomId: string
    username: string
    reason: string
  }
}
