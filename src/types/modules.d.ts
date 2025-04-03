declare module 'express' {
  import { Express as ExpressType, Request as RequestType, Response as ResponseType, Router as RouterType, NextFunction as NextFunctionType } from 'express-serve-static-core';
  
  export const Router: () => RouterType;
  export type Request<P = any, ResBody = any, ReqBody = any> = RequestType<P, ResBody, ReqBody>;
  export type Response = ResponseType;
  export type NextFunction = NextFunctionType;
  
  interface Express extends ExpressType {
    json: (options?: any) => any;
    urlencoded: (options?: any) => any;
    use: (handler: any) => Express;
    listen: (port: number, callback?: () => void) => any;
  }
  
  interface ExpressConstructor {
    (): Express;
    json: (options?: any) => any;
    urlencoded: (options?: any) => any;
  }
  
  const express: ExpressConstructor;
  export default express;
}

declare module 'cors' {
  import { RequestHandler } from 'express';
  function cors(): RequestHandler;
  export = cors;
}

declare module 'morgan' {
  import { RequestHandler } from 'express';
  function morgan(format: string, options?: any): RequestHandler;
  export = morgan;
}

declare module 'helmet' {
  import { RequestHandler } from 'express';
  function helmet(): RequestHandler;
  export = helmet;
}
