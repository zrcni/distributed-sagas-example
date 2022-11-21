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
