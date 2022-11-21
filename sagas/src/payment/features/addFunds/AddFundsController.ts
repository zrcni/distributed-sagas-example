import { Request } from "express"
import { HttpController } from "@/server/HttpController"
import { PaymentService } from "@/payment/PaymentService"
import { NotFoundError, ValidationError } from "@/errors"

type AddFundsResult = undefined | { error: Error }

type AddFundsRequest = Request<
  { username: string },
  unknown,
  { amount: number }
>

export class AddFundsController extends HttpController<AddFundsResult> {
  private paymentService: PaymentService

  constructor(paymentService: PaymentService) {
    super()
    this.paymentService = paymentService
  }

  async exec(req: AddFundsRequest) {
    const username = req.params.username
    const amount = req.body.amount

    if (username == null) {
      return this.error(new ValidationError("username is required"))
    }

    if (amount == null) {
      return this.error(new ValidationError("amount is required"))
    }

    const getAccountResult = await this.paymentService.getAccount(username)
    if (getAccountResult.isError()) {
      return this.error(getAccountResult.data)
    }

    const existingAccount = getAccountResult.data

    if (!existingAccount) {
      return this.error(
        new NotFoundError("account does not exist", {
          username,
        })
      )
    }

    const addFundsResult = await this.paymentService.addFunds(
      username,
      req.body.amount
    )

    if (addFundsResult.isError()) {
      return this.error(addFundsResult.data)
    }

    return this.noContent()
  }
}
