import { ValidationError } from "@/errors"
import { Result, ResultError, ResultOk } from "@/Result"

export interface IPaymentAccount {
  username: string
  balance: number
}

export class PaymentAccount {
  username: string
  balance: number

  constructor(data: IPaymentAccount) {
    this.username = data.username
    this.balance = data.balance
  }

  toJSON(): IPaymentAccount {
    return {
      username: this.username,
      balance: this.balance,
    }
  }

  addFunds(amount: number): ResultOk {
    this.balance += amount
    return Result.ok()
  }

  subtractFunds(amount: number): ResultOk | ResultError<ValidationError> {
    if (amount > this.balance) {
      return Result.error(
        new ValidationError("payment account does not have enough funds", {
          balance: this.balance,
        })
      )
    }

    this.balance -= amount

    return Result.ok()
  }
}
