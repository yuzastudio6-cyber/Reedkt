import { createMockCreditEstimateStore } from './mock-credit-estimate-store'
import { createMockCreditDataStore } from './mock-credit-data-store'
import { createMockCreditReservationStore } from './mock-credit-reservation-store'

export const sharedMockCreditEstimateStore = createMockCreditEstimateStore()
export const sharedMockCreditReservationStore = createMockCreditReservationStore()
export const sharedMockCreditDataStore = createMockCreditDataStore()
