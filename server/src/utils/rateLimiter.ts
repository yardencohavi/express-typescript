// import { NextFunction, Response } from "express";

// interface UserReq {
//   createdAt: number;
//   numOfReq: number;
// }
// const usersMap = new Map<string, UserReq>();

// const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
//   const date = Date.now();
//   const key = req.headers.get("x-api-key") as string;
//   if (usersMap.has(key)) {
//     const { createdAt, numOfReq } = usersMap.get(key) as UserReq;
//     if (date - createdAt < 6000 && numOfReq < 10) {
//       usersMap.set(key, { createdAt, numOfReq: numOfReq + 1 });
//       next();
//     } else if (date - createdAt > 6000) {
//       usersMap.set(key, { createdAt: date, numOfReq: 1 });
//       next();
//     } else {
//       res.status(404).send("Unuthorized");
//     }
//   }
//   usersMap.set(key, { createdAt: date, numOfReq: 1 });
//   next();
// };
