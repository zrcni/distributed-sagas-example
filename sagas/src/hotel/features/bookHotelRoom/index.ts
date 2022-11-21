import { sagaInChannel } from "@/channel"
import { Channel } from "@/channel/Channel"
import { Queue } from "@/channel/Queue"
import { hotelService } from "@/hotel"
import { paymentService } from "@/payment"
import { sagaCoordinator } from "@/sagas"
import { BookHotelRoomController } from "./BookHotelRoomController"
import { BookHotelRoomSubscription } from "./BookHotelRoomSubscription"
import { HotelRoomBookedMessagePayload } from "./types"

export const bookHotelRoomController = new BookHotelRoomController(
  hotelService,
  sagaInChannel
)

const bookHotelRoomNotificationChannel = new Channel(new Queue())

bookHotelRoomNotificationChannel.subscribe<HotelRoomBookedMessagePayload>(
  (payload) => {
    console.info(
      `Hotel room ${payload.roomId} booked by ${payload.username} for ${payload.amount}€`
    )
  }
)

new BookHotelRoomSubscription(
  sagaInChannel,
  bookHotelRoomNotificationChannel,
  sagaCoordinator,
  hotelService,
  paymentService
).start()
