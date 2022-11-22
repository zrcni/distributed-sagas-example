distributed-sagas-example

---

Saga implementation: [BookHotelRoomSaga](./sagas/src/hotel/features/bookHotelRoom/BookHotelRoomSaga.ts)   
Subscription that listens to queue and runs the saga: [BookHotelRoomSubscription](./sagas/src/hotel/features/bookHotelRoom/BookHotelRoomSubscription.ts)   
HTTP request handler that publishes a message to queue: [BookHotelRoomController](./sagas/src/hotel/features/bookHotelRoom/BookHotelRoomController.ts)

[Tests](./sagas/src/hotel/features/bookHotelRoom/__tests__/BookHotelRoomSaga.test.ts)
(BookHotelRoomController not included)

---

references:

- https://github.com/CaitieM20/DistributedSagas
- https://github.com/eventuate-tram/eventuate-tram-sagas

---

monadic error handling  
distributed sagas  
OOP AF

---

```
1.
Start

2.
Book hotel
// Book car
// Book flight

3.
Pay

4.
End

```
