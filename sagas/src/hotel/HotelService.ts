import {
  HotelRoomAlreadyExistsError,
  HotelRoomAlreadyReservedError,
  HotelRoomNotFoundError,
} from "@/errors"
import { Result, ResultError, ResultOk } from "@/Result"
import { KeyValueStore } from "@/store/types"
import { uuid } from "@/utils"
import { HotelRoom, IHotelRoom } from "./HotelRoom"
import {
  HotelRoomReservation,
  IHotelRoomReservation,
} from "./HotelRoomReservation"

export class HotelService {
  reservationStore: KeyValueStore<IHotelRoomReservation>
  roomStore: KeyValueStore<IHotelRoom>

  constructor(
    reservationStore: KeyValueStore<IHotelRoomReservation>,
    roomStore: KeyValueStore<IHotelRoom>
  ) {
    this.reservationStore = reservationStore
    this.roomStore = roomStore
  }

  async createRoom(
    roomId: string,
    priceAmount: number
  ): Promise<ResultOk<IHotelRoom> | ResultError> {
    let room: IHotelRoom
    try {
      room = await this.roomStore.get(roomId)
    } catch (err) {
      return Result.error<Error>(err)
    }

    if (room) {
      return Result.error(
        new HotelRoomAlreadyExistsError("room already exists", {
          roomId,
        })
      )
    }

    const newRoom = new HotelRoom({ roomId, priceAmount })

    try {
      await this.roomStore.set(roomId, newRoom.toJSON())
      return Result.ok(newRoom.toJSON())
    } catch (err) {
      return Result.error<Error>(err)
    }
  }

  async getRoom(
    roomId: string
  ): Promise<ResultOk<IHotelRoom | null> | ResultError> {
    let room: IHotelRoom
    try {
      room = await this.roomStore.get(roomId)
    } catch (err) {
      return Result.error<Error>(err)
    }

    return Result.ok(room)
  }

  async getReservation(roomId: string) {
    try {
      const reservation = await this.reservationStore.get(roomId)
      return Result.ok(reservation)
    } catch (err) {
      return Result.error<Error>(err)
    }
  }

  async reserveRoom(
    roomId: string,
    username: string
  ): Promise<ResultOk<HotelRoomReservation> | ResultError> {
    let room: IHotelRoom

    try {
      room = await this.roomStore.get(roomId)
    } catch (err) {
      return Result.error<Error>(err)
    }

    if (!room) {
      return Result.error(
        new HotelRoomNotFoundError("room does not exist", {
          roomId,
        })
      )
    }

    let data: IHotelRoomReservation

    try {
      data = await this.reservationStore.get(roomId)
    } catch (err) {
      return Result.error<Error>(err)
    }

    // idempotency
    if (data && data.username === username) {
      return Result.ok(new HotelRoomReservation(data))
    }

    if (data) {
      return Result.error(
        new HotelRoomAlreadyReservedError(
          "room is already reserved by someone else",
          {
            roomId,
          }
        )
      )
    }

    const reservation = new HotelRoomReservation({
      confirmationNumber: uuid(),
      roomId,
      username,
    })

    try {
      await this.reservationStore.set(roomId, reservation.toJSON())
    } catch (err) {
      return Result.error<Error>(err)
    }

    return Result.ok(reservation)
  }

  async releaseRoom(confirmationNumber: string) {
    let data: IHotelRoomReservation

    for (const v of await this.reservationStore.getAll()) {
      if (v.confirmationNumber === confirmationNumber) {
        data = v
        break
      }
    }

    // idempotency
    // (this should be handled differently in real use)
    if (!data) {
      return Result.ok()
    }

    await this.reservationStore.remove(data.roomId)

    return Result.ok()
  }
}
