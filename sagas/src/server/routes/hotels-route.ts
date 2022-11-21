import { Router } from "express"
import { BookHotelRoomController } from "@/hotel/features/bookHotelRoom/BookHotelRoomController"
import { CreateHotelRoomController } from "@/hotel/features/createHotelRoom/CreateHotelRoomController"
import { Routes } from "../types"

interface HotelsRouteControllers {
  bookHotelRoomController: BookHotelRoomController
  createHotelRoomController: CreateHotelRoomController
}

export class HotelsRoute implements Routes {
  public path = "/hotels"
  public router = Router()

  constructor(controllers: HotelsRouteControllers) {
    this.initializeRoutes(controllers)
  }

  private initializeRoutes(controllers: HotelsRouteControllers) {
    this.router.post(
      this.path + "/rooms/:room_id/book",
      controllers.bookHotelRoomController.handleRequest
    )
    this.router.post(
      this.path + "/rooms",
      controllers.createHotelRoomController.handleRequest
    )
  }
}
