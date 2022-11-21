import { Router } from "express"
import { BookHotelRoomController } from "@/hotel/features/bookHotelRoom/BookHotelRoomController"
import { Routes } from "../types"

interface HotelsRouteControllers {
  bookHotelRoomController: BookHotelRoomController
}

export class HotelsRoute implements Routes {
  public path = "/hotels"
  public router = Router()

  constructor(controllers: HotelsRouteControllers) {
    this.initializeRoutes(controllers)
  }

  private initializeRoutes(controllers: HotelsRouteControllers) {
    this.router.post(
      this.path + "/rooms/book",
      controllers.bookHotelRoomController.handleRequest
    )
  }
}
