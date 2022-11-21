import { Router } from "express"

export interface Routes {
  path?: string
  router: Router
}

export interface HttpResult<T = unknown> {
  status: number
  data?: T
}
