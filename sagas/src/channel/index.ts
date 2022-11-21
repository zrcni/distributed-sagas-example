import { Channel } from "./Channel"
import { Queue } from "./Queue"

export const sagaChannel = new Channel(new Queue())
