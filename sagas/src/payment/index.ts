import { InMemoryKeyValueStore } from "@/store/InMemoryKeyValueStore"
import { IInvoice } from "./Invoice"
import { IPaymentAccount } from "./PaymentAccount"
import { PaymentService } from "./PaymentService"

export const accountStore = new InMemoryKeyValueStore<IPaymentAccount>()
export const invoiceStore = new InMemoryKeyValueStore<IInvoice>()
export const paymentService = new PaymentService(accountStore, invoiceStore)
