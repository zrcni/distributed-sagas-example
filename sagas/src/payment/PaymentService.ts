import { ConflictError, NotFoundError } from "@/errors"
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

  /**
   * Create invoice and subtract balance from payment account
   */
  async requestPayment(
    paymentNumber: string,
    username: string,
    amount: number
  ): Promise<ResultOk<RequestPaymentResult> | ResultError> {
    let invoiceData: IInvoice

    try {
      invoiceData = await this.invoiceStore.get(paymentNumber)
    } catch (err) {
      return Result.error<Error>(err)
    }

    const existingInvoice = invoiceData && new Invoice(invoiceData)

    if (existingInvoice) {
      if (existingInvoice.isCancelled) {
        return Result.error(
          new ConflictError("invoice has been cancelled", {
            invoiceNumber: existingInvoice.invoiceNumber,
            paymentNumber,
          })
        )
      }

      // idempotency
      return Result.ok({ invoiceNumber: existingInvoice.invoiceNumber })
    }

    let accountData: IPaymentAccount

    try {
      accountData = await this.accountStore.get(username)
    } catch (err) {
      return Result.error<Error>(err)
    }

    if (!accountData) {
      return Result.error(
        new NotFoundError("payment account not found", { username })
      )
    }

    const paymentAccount = new PaymentAccount(accountData)

    const result = paymentAccount.subtractBalance(amount)
    if (result.isError()) {
      return result
    }

    const newInvoice = new Invoice({ invoiceNumber: uuid(), username, amount })

    try {
      await this.invoiceStore.set(newInvoice.invoiceNumber, newInvoice.toJSON())
    } catch (err) {
      return Result.error<Error>(err)
    }

    try {
      await this.accountStore.set(username, paymentAccount.toJSON())
    } catch (err) {
      await this.invoiceStore.remove(newInvoice.invoiceNumber)
      return Result.error(err)
    }

    return Result.ok({ invoiceNumber: newInvoice.invoiceNumber })
  }

  /**
   * Add balance to payment account and cancel invoice
   */
  async refundPayment(paymentNumber: string) {
    let invoiceData: IInvoice

    try {
      invoiceData = await this.invoiceStore.get(paymentNumber)
    } catch (err) {
      return Result.error<Error>(err)
    }

    const invoice = invoiceData && new Invoice(invoiceData)

    if (!invoice) {
      return Result.error(
        new NotFoundError("invoice does not exist for the payment number", {
          paymentNumber,
        })
      )
    }

    // idempotency
    if (invoice.isCancelled) {
      return Result.ok()
    }

    let accountData: IPaymentAccount

    try {
      accountData = await this.accountStore.get(invoiceData.username)
    } catch (err) {
      return Result.error<Error>(err)
    }

    if (!accountData) {
      return Result.error(
        new NotFoundError("payment account not found", {
          username: invoiceData.username,
        })
      )
    }

    const paymentAccount = new PaymentAccount(accountData)

    const result = paymentAccount.addBalance(invoiceData.amount)
    if (result.isError()) {
      return result
    }

    const prevInvoiceData = invoice.toJSON()

    invoice.cancel()

    try {
      await this.invoiceStore.set(invoice.invoiceNumber, invoice.toJSON())
    } catch (err) {
      return Result.error<Error>(err)
    }

    try {
      await this.accountStore.set(
        paymentAccount.username,
        paymentAccount.toJSON()
      )
    } catch (err) {
      await this.invoiceStore.set(invoice.invoiceNumber, prevInvoiceData)
      Result.error(err)
    }

    return Result.ok()
  }
}
