export interface IHotelRoom {
  roomId: string
  priceAmount: number
}

export class HotelRoom {
  roomId: string
  priceAmount: number

  toJSON(): IHotelRoom {
    return {
      roomId: this.roomId,
      priceAmount: this.priceAmount,
    }
  }

  constructor(data: IHotelRoom) {
    this.roomId = data.roomId
    this.priceAmount = data.priceAmount
  }
}
