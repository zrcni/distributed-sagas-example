export interface IHotelRoomReservation {
  roomId: string
  username: string
  confirmationNumber: string
}

export class HotelRoomReservation {
  roomId: string
  username: string
  confirmationNumber: string

  toJSON(): IHotelRoomReservation {
    return {
      roomId: this.roomId,
      username: this.username,
      confirmationNumber: this.confirmationNumber,
    }
  }

  constructor(data: IHotelRoomReservation) {
    this.roomId = data.roomId
    this.username = data.username
    this.confirmationNumber = data.confirmationNumber
  }
}
