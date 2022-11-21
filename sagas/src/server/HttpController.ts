import { Request, Response } from "express"
import { AppError, appErrorStatusCode, UnexpectedError } from "@/errors"
import { HttpResult } from "./types"

export abstract class HttpController<ResBody = unknown> {
  constructor() {
    this.handleRequest = this.handleRequest.bind(this)
  }

  abstract exec(
    req: Request,
    res: Response<ResBody>
  ): HttpResult<ResBody> | Promise<HttpResult<ResBody>>

  protected ok<T = unknown>(data: T): HttpResult<T> {
    return {
      status: 200,
      data,
    }
  }

  protected noContent(): HttpResult<undefined> {
    return {
      status: 201,
    }
  }

  protected error<Err extends Error>(error: Err) {
    return this.getErrorResult<Err>(error)
  }

  public async handleRequest(req: Request, res: Response) {
    try {
      const result = await this.exec(req, res)
      res.status(result.status)
      return "data" in result ? res.json(result.data) : res.end()
    } catch (err) {
      const errorResult = this.getErrorResult(err)
      return res.status(errorResult.status).json({ error: errorResult.data })
    }
  }

  getErrorResult<Err extends Error>(error: Err): HttpResult<{ error: Err }> {
    if (error instanceof AppError) {
      return {
        status: appErrorStatusCode(error),
        data: { error },
      }
    }

    return {
      status: 500,
      data: {
        // TODO type
        error: new UnexpectedError(
          "unexpected error occurred while handling the request"
        ) as unknown as Err,
      },
    }
  }
}
