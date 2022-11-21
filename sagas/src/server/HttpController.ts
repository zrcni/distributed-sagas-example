import { Request, Response } from "express"
import { AppError, appErrorStatusCode, UnexpectedError } from "@/errors"
import { HttpResult } from "./types"

export abstract class HttpController {
  abstract exec(req: Request, res: Response): HttpResult | Promise<HttpResult>

  protected ok<T = unknown>(data: T): HttpResult {
    return {
      status: 200,
      data,
    }
  }

  protected noContent(): HttpResult {
    return {
      status: 201,
    }
  }

  protected error<Err extends Error>(error: Err) {
    return this.getErrorResult(error)
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

  private getErrorResult(error: Error) {
    if (error instanceof AppError) {
      return {
        status: appErrorStatusCode(error),
        data: { error: error.toJSON() },
      }
    }

    return {
      status: 500,
      data: {
        error: new UnexpectedError(
          "unexpected error occurred while handling the request"
        ),
      },
    }
  }
}
