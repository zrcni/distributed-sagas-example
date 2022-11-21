export interface IInvoice {
  invoiceNumber: string
  username: string
  amount: number
  cancelledAt: Date | null
}

interface InvoiceParams extends Omit<IInvoice, "cancelledAt"> {
  cancelledAt?: IInvoice["cancelledAt"]
}

export class Invoice {
  invoiceNumber: string
  username: string
  amount: number
  cancelledAt: Date | null

  toJSON() {
    return {
      invoiceNumber: this.invoiceNumber,
      username: this.username,
      amount: this.amount,
      cancelledAt: this.cancelledAt,
    }
  }

  get isCancelled() {
    return Boolean(this.cancelledAt)
  }

  cancel() {
    if (!this.cancelledAt) {
      this.cancelledAt = new Date()
    }
  }

  reverseCancellation() {
    if (this.cancelledAt) {
      this.cancelledAt = null
    }
  }

  constructor(data: InvoiceParams) {
    this.invoiceNumber = data.invoiceNumber
    this.username = data.username
    this.amount = data.amount
    this.cancelledAt = data.cancelledAt ?? null
  }
}
