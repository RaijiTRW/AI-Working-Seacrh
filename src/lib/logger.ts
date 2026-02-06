import fs from "fs";
import path from "path";

const isDevelopment = process.env.NODE_ENV === "development";
const logsDir = path.join(process.cwd(), "logs");

// Типы логов
type LogLevel = "info" | "error" | "warn" | "success";

// Цвета для терминала
const colors = {
  info: "\x1b[36m",    // cyan
  error: "\x1b[31m",   // red
  warn: "\x1b[33m",    // yellow
  success: "\x1b[32m", // green
  reset: "\x1b[0m",    // reset
};

class Logger {
  private getLogFileName(): string {
    const date = new Date().toISOString().split("T")[0];
    return path.join(logsDir, `${date}.log`);
  }

  private ensureLogsDir(): void {
    if (!isDevelopment && !fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private writeToFile(level: LogLevel, message: string, meta?: any): void {
    if (isDevelopment) return; // Не пишем в файлы на локале

    try {
      this.ensureLogsDir();
      const logFile = this.getLogFileName();
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${
        meta ? " | " + JSON.stringify(meta) : ""
      }\n`;

      fs.appendFileSync(logFile, logLine);
    } catch (err) {
      // Silently fail - не ломаем приложение если логи не записались
    }
  }

  private logToConsole(level: LogLevel, message: string, meta?: any): void {
    const color = colors[level];
    const timestamp = new Date().toLocaleTimeString("ru-RU");
    const prefix = `${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset}`;

    if (meta) {
      console.log(prefix, message, meta);
    } else {
      console.log(prefix, message);
    }
  }

  info(message: string, meta?: any): void {
    this.logToConsole("info", message, meta);
    this.writeToFile("info", message, meta);
  }

  error(message: string, meta?: any): void {
    this.logToConsole("error", message, meta);
    this.writeToFile("error", message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logToConsole("warn", message, meta);
    this.writeToFile("warn", message, meta);
  }

  success(message: string, meta?: any): void {
    this.logToConsole("success", message, meta);
    this.writeToFile("success", message, meta);
  }

  // Специализированные методы для удобства
  subscription(message: string, meta?: any): void {
    this.info(`[Subscription] ${message}`, meta);
  }

  payment(message: string, meta?: any): void {
    this.info(`[Payment] ${message}`, meta);
  }

  webhook(message: string, meta?: any): void {
    this.info(`[Webhook] ${message}`, meta);
  }

  auth(message: string, meta?: any): void {
    this.info(`[Auth] ${message}`, meta);
  }
}

// Экспортируем единый экземпляр
export const logger = new Logger();

// Удобные функции для быстрого использования
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  success: (message: string, meta?: any) => logger.success(message, meta),
  subscription: (message: string, meta?: any) => logger.subscription(message, meta),
  payment: (message: string, meta?: any) => logger.payment(message, meta),
  webhook: (message: string, meta?: any) => logger.webhook(message, meta),
  auth: (message: string, meta?: any) => logger.auth(message, meta),
};
