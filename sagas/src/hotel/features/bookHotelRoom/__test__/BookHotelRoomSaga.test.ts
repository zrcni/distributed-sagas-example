import { Channel } from "@/channel/Channel"
import { Queue } from "@/channel/Queue"
import { HotelService } from "@/hotel/HotelService"
import { PaymentService } from "@/payment/PaymentService"
import { InMemorySagaLog } from "@/sagas/InMemorySagaLog"
import { SagaCoordinator } from "@/sagas/SagaCoordinator"
import { InMemoryKeyValueStore } from "@/store/InMemoryKeyValueStore"
import { BookHotelRoomSubscription } from "../BookHotelRoomSubscription"
import { BookHotelRoomMessagePayload, BookHotelRoomSagaData } from "../types"
import waitFor from "wait-for-expect"

describe("BookHotelRoomSaga", () => {
  let hotelService: HotelService
  let paymentService: PaymentService
  let coordinator: SagaCoordinator

  beforeEach(() => {
    hotelService = new HotelService(
      new InMemoryKeyValueStore(),
      new InMemoryKeyValueStore()
    )
    paymentService = new PaymentService(
      new InMemoryKeyValueStore(),
      new InMemoryKeyValueStore()
    )
    coordinator = InMemorySagaLog.createInMemorySagaCoordinator()
  })

  /**
   * - saga is completed successfully
   * - reservation is created
   * - invoice is created
   */
  it("book a hotel room", async () => {
    /** arrange */
    const createRoomResult = await hotelService.createRoom("room-1", 500)
    expect(createRoomResult).toBeOkResult()

    const createAccountResult = await paymentService.createAccount("user-1")
    expect(createAccountResult).toBeOkResult()

    const addFundsResult = await paymentService.addFunds("user-1", 500)
    expect(addFundsResult).toBeOkResult()

    const inChannel = new Channel(new Queue())
    const outChannel = new Channel(new Queue())

    new BookHotelRoomSubscription(
      inChannel,
      outChannel,
      coordinator,
      hotelService,
      paymentService
    ).start()

    const outChanHandler = jest.fn()
    outChannel.subscribe(outChanHandler)

    /** act */
    inChannel.publish<BookHotelRoomMessagePayload>({
      eventName: "book-hotel-room",
      username: "user-1",
      amount: 500,
      roomId: "room-1",
    })

    /** assert */
    await waitFor(() => {
      expect(outChanHandler).toHaveBeenCalled()
    })

    expect(outChanHandler).toHaveBeenCalledWith({
      amount: 500,
      roomId: "room-1",
      username: "user-1",
    })

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
