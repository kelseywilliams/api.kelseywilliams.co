// logger.js
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  // stdout only: k8s and docker capture the container's stdout (kubectl logs / docker logs),
  // which is the canonical log source. No file transport, so the pod can run with a
  // read-only root filesystem and no /logs volume.
  transports: [
    new transports.Console(),
  ]
});

export default logger;