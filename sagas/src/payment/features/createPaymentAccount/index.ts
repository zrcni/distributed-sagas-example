import { paymentService } from "@/payment"
import { CreatePaymentAccountController } from "./CreatePaymentAccountController"

export const createPaymentAccountController =
  new CreatePaymentAccountController(paymentService)
