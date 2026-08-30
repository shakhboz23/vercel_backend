import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';

@Catch()
export default class InternalServerErrorExceptionFilter
  implements ExceptionFilter
{
  catch(exception: Error, host: ArgumentsHost) {
    const errMsg = exception.message;
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    res.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      res.status(exception.getStatus()).json(exception.getResponse());
      return;
    }
    res.json({
      message: errMsg,
    });
  }
}
