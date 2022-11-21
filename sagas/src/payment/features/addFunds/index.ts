import { paymentService } from "@/payment"
import { AddFundsController } from "./AddFundsController"

export const addFundsController = new AddFundsController(paymentService)
