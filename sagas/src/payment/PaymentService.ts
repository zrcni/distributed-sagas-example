import { NotFoundError } from "@/errors"
import { Result, ResultError, ResultOk } from "@/Result"
import { KeyValueStore } from "@/store/types"
import { uuid } from "@/utils"
import { IInvoice, Invoice } from "./Invoice"
import { IPaymentAccount, PaymentAccount } from "./PaymentAccount"

type RequestPaymentResult = {
  invoiceNumber: string
}

export class PaymentService {
  accountStore: KeyValueStore<IPaymentAccount>
  invoiceStore: KeyValueStore<IInvoice>

  constructor(
    accountStore: KeyValueStore<IPaymentAccount>,
    invoiceStore: KeyValueStore<IInvoice>
  ) {
    this.accountStore = accountStore
    this.invoiceStore = invoiceStore
  }

  async requestPayment(
    paymentNumber: string,
    username: string,
    amount: number
  ): Promise<ResultOk<RequestPaymentResult> | ResultError> {
    let invoiceData: IInvoice

    try {
      invoiceData = await this.invoiceStore.get(paymentNumber)
    } catch (err) {
      return Result.error(err)
    }

    // idempotency
    if (invoiceData) {
      return Result.ok({ invoiceNumber: invoiceData.invoiceNumber })
    }

    let accountData: IPaymentAccount

    try {
      accountData = await this.accountStore.get(username)
    } catch (err) {
      return Result.error(err)
    }

    if (!accountData) {
      return Result.error(
        new NotFoundError("payment account not found", { username })
      )
    }

    const paymentAccount = new PaymentAccount(accountData)

    const result = paymentAccount.subtract(amount)
    if (result.isError()) {
      return result
    }

    const invoice = new Invoice({ invoiceNumber: uuid(), username })

    try {
      await this.invoiceStore.set(invoice.invoiceNumber, invoice.toJSON())
    } catch (err) {
      return Result.error(err)
    }

    try {
      await this.accountStore.set(username, paymentAccount.toJSON())
    } catch (err) {
      await this.invoiceStore.remove(invoice.invoiceNumber)
      return Result.error(err)
    }

    return Result.ok({ invoiceNumber: invoice.toJSON().invoiceNumber })
  }
}
