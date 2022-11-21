import compression from "compression"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import express from "express"
import { stream } from "@/logger"
import { Routes } from "./types"

type AppOptions = {
  port: number
}

export class App {
  private app: express.Application
  public port: number

  constructor(routes: Routes[], options: AppOptions) {
    this.app = express()
    this.port = options.port

    this.initializeMiddlewares()
    this.initializeRoutes(routes)
  }

  getServer() {
    return this.app
  }

  public listen(callback: (port: number) => void) {
    this.app.listen(this.port, () => callback(this.port))
  }

  private initializeMiddlewares() {
    this.app.use(morgan("dev", { stream }))
    this.app.use(compression())
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(cookieParser())
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use("/", route.router)
    })
  }
}
