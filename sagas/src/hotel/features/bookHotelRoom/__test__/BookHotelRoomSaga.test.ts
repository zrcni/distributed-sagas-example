import { HotelService } from "@/hotel/HotelService"
import { PaymentService } from "@/payment"
import { InMemorySagaLog } from "@/sagas/InMemorySagaLog"
import { SagaRunner } from "@/sagas/SagaRunner"
import { InMemoryKeyValueStore } from "@/store/InMemoryKeyValueStore"
import { BookHotelRoomSaga } from "../BookHotelRoomSaga"
import { BookHotelRoomSagaData } from "../types"

describe("BookHotelRoomSaga", () => {
  let hotelService: HotelService
  let paymentService: PaymentService

  beforeEach(() => {
    hotelService = new HotelService(new InMemoryKeyValueStore())
    paymentService = new PaymentService(
      new InMemoryKeyValueStore(),
      new InMemoryKeyValueStore()
    )
  })

  /**
   * - saga is completed successfully
   * - reservation is created
   * - invoice is created
   */
  it("book a hotel room", async () => {
    /** arrange */
    const coordinator = InMemorySagaLog.createInMemorySagaCoordinator()

    const sagaResult = await coordinator.createSaga<BookHotelRoomSagaData>(
      "book-hotel-room",
      {
        roomId: "room-1",
        username: "user-1",
        amount: 500,
      }
    )
    expect(sagaResult).toBeOkResult()
    if (sagaResult.isError()) return

    const saga = sagaResult.data
    const bookHotelRoomSaga = new BookHotelRoomSaga(
      hotelService,
      paymentService
    ).getSagaDefinition()

    const createAccountResult = await paymentService.createAccount("user-1")
    expect(createAccountResult).toBeOkResult()

    const addBalanceResult = await paymentService.addBalance("user-1", 500)
    expect(addBalanceResult).toBeOkResult()

    /** act */
    await new SagaRunner(saga, bookHotelRoomSaga)
      .onError((err) => console.error(err))
      .run()

    /** assert */
    expect(await saga.isSagaCompleted()).toBe(true)

    const getReservationResult = await hotelService.getReservation("room-1")
    expect(getReservationResult).toBeOkResult()
    expect(getReservationResult.data).toHaveProperty("username", "user-1")

    const getInvoicesResult = await paymentService.getInvoicesByUsername(
      "user-1"
    )
    expect(getInvoicesResult).toBeOkResult()
    if (getInvoicesResult.isError()) return

    expect(getInvoicesResult.data).toHaveLength(1)
    const invoice = getInvoicesResult.data[0]
    expect(invoice).toHaveProperty("amount", 500)
    expect(invoice.cancelledAt).toBe(null)
  })
})
