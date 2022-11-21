export type BookHotelRoomMessagePayload = {
  eventName: "book-hotel-room"
  roomId: string
  amount: number
  username: string
}

export type ReserveRoomMessagePayload = {
  eventName: "reserve-room"
  sagaId: string
}

export type RoomReservedMessagePayload = {
  eventName: "room-reserved"
  confirmationNumber: string
  roomId: string
}

export type BookHotelRoomSagaStartPayload = {
  roomId: string
  username: string
}
