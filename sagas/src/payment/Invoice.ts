export interface IInvoice {
  invoiceNumber: string
  username: string
}

export class Invoice {
  invoiceNumber: string
  username: string

  toJSON() {
    return {
      invoiceNumber: this.invoiceNumber,
      username: this.username,
    }
  }

  constructor(data: IInvoice) {
    this.invoiceNumber = data.invoiceNumber
    this.username = data.username
  }
}
