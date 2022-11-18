import { ConflictError, NotFoundError } from "@/errors"
import { Result, ResultError, ResultOk } from "@/Result"
import { KeyValueStore } from "@/store/types"
import { uuid } from "@/utils"
import {
  HotelRoomReservation,
  IHotelRoomReservation,
} from "./HotelRoomReservation"

export class HotelService {
  store: KeyValueStore<IHotelRoomReservation>

  constructor(store: KeyValueStore<IHotelRoomReservation>) {
    this.store = store
  }

  async reserveRoom(
    roomId: string,
    username: string
  ): Promise<ResultOk<HotelRoomReservation> | ResultError> {
    let data: IHotelRoomReservation

    try {
      data = await this.store.get(roomId)
    } catch (err) {
      return Result.error(err)
    }

    // idempotency
    if (data && data.username === username) {
      return Result.ok(new HotelRoomReservation(data))
    }

    if (data) {
      return Result.error(
        new ConflictError("room is already reserved by someone else", {
          roomId,
        })
      )
    }

    const reservation = new HotelRoomReservation({
      confirmationNumber: uuid(),
      roomId,
      username,
    })

    try {
      await this.store.set(roomId, reservation.toJSON())
    } catch (err) {
      return Result.error(err)
    }

    return Result.ok(reservation)
  }

  async releaseRoom(confirmationNumber: string) {
    let data: IHotelRoomReservation

    for (const v of await this.store.getAll()) {
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

    await this.store.remove(data.roomId)

    return Result.ok()
  }
}
