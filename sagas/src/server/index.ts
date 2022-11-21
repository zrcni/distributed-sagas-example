import { logger } from "@/logger"
import { cfg } from "@/config"
import { bookHotelRoomController } from "@/hotel/features/bookHotelRoom"
import { createHotelRoomController } from "@/hotel/features/createHotelRoom"
import { createPaymentAccountController } from "@/payment/features/createPaymentAccount"
import { addFundsController } from "@/payment/features/addFunds"
import { App } from "./App"
import { HotelsRoute } from "./routes/hotels-route"
import { PaymentsRoute } from "./routes/payments-route"

const routes = [
  new HotelsRoute({ bookHotelRoomController, createHotelRoomController }),
  new PaymentsRoute({ createPaymentAccountController, addFundsController }),
]

const app = new App(routes, {
  port: cfg.port,
})

app.listen((port) => {
  logger.info(`🚀 App listening on the port ${port}`)
})
