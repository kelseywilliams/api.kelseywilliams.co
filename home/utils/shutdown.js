// import { disconnectPool } from "./postgres.js";
// import { disconnectRedis } from "./redis.js";
// import logger from "./logger.js"

// let shuttingDown = false;

// export default async function shutdown(server, signal) {
//     if(shuttingDown) return;
//     console.log("Can you even see me?");
//     shuttingDown = true;

//     logger.info(`Received ${signal}, shutting down gracefully.`);

//     if(server){
//         try {
//             await new Promise((resolve) => server.close(resolve));
//         } catch (err) {
//             logger.error("Error during shutdown", err);
//         }

//     } else {
//         throw Error("server object must be passed");
//     }
//     try {
//         await Promise.all([
//             disconnectPool(),
//             disconnectRedis()
//         ]);
//     } catch (err){
//         logger.error("Error during shutdown.", err);
//     } 
// }