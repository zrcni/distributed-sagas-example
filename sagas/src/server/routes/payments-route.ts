import { Router } from "express"
import { CreatePaymentAccountController } from "@/payment/features/createPaymentAccount/CreatePaymentAccountController"
import { AddFundsController } from "@/payment/features/addFunds/AddFundsController"
import { Routes } from "../types"

interface PaymentsRouteControllers {
  createPaymentAccountController: CreatePaymentAccountController
  addFundsController: AddFundsController
}

export class PaymentsRoute implements Routes {
  public path = "/payments"
  public router = Router()

  constructor(controllers: PaymentsRouteControllers) {
    this.initializeRoutes(controllers)
  }

  private initializeRoutes(controllers: PaymentsRouteControllers) {
    this.router.post(
      this.path + "/accounts",
      controllers.createPaymentAccountController.handleRequest
    )
    this.router.post(
      this.path + "/accounts/:username/funds",
      controllers.addFundsController.handleRequest
    )
  }
}
