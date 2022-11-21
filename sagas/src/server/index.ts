import { logger } from "@/logger"
import { cfg } from "@/config"
import { bookHotelRoomController } from "@/hotel/features/bookHotelRoom"
import { App } from "./App"
import { HotelsRoute } from "./routes/hotels-route"

const routes = [new HotelsRoute({ bookHotelRoomController })]

const app = new App(routes, {
  port: cfg.port,
})

app.listen((port) => {
  logger.info(`🚀 App listening on the port ${port}`)
})
