import { Request } from "express"
import { HttpController } from "@/server/HttpController"
import { PaymentService } from "@/payment/PaymentService"
import { ConflictError } from "@/errors"

type CreatePaymentAccountResult = undefined | { error: Error }

type CreatePaymentAccountRequest = Request<
  unknown,
  unknown,
  { username: string }
>

export class CreatePaymentAccountController extends HttpController<CreatePaymentAccountResult> {
  private paymentService: PaymentService

  constructor(paymentService: PaymentService) {
    super()
    this.paymentService = paymentService
  }

  async exec(req: CreatePaymentAccountRequest) {
    const username = req.body.username

    const getAccountResult = await this.paymentService.getAccount(username)
    if (getAccountResult.isError()) {
      return this.error(getAccountResult.data)
    }

    const existingAccount = getAccountResult.data

    if (existingAccount) {
      return this.error(
        new ConflictError("account is already taken", {
          username,
        })
      )
    }

    const createAccountResult = await this.paymentService.createAccount(
      username
    )

    if (createAccountResult.isError()) {
      return this.error(createAccountResult.data)
    }

    return this.noContent()
  }
}
