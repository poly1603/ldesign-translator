import chalk from 'chalk'

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SUCCESS = 4,
}

/**
 * 日志器类
 */
class Logger {
  private level: LogLevel = LogLevel.INFO
  private verbose = false

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * 设置详细模式
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose
    if (verbose) {
      this.level = LogLevel.DEBUG
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(`[DEBUG] ${message}`), ...args)
    }
  }

  /**
   * 信息日志
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.blue(`ℹ ${message}`), ...args)
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(chalk.yellow(`⚠ ${message}`), ...args)
    }
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error | any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(chalk.red(`✖ ${message}`))
      if (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message))
          if (this.verbose && error.stack) {
            console.error(chalk.gray(error.stack))
          }
        } else {
          console.error(chalk.red(JSON.stringify(error, null, 2)))
        }
      }
    }
  }

  /**
   * 成功日志
   */
  success(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.SUCCESS) {
      console.log(chalk.green(`✓ ${message}`), ...args)
    }
  }

  /**
   * 分组开始
   */
  group(label: string): void {
    console.group(chalk.bold(label))
  }

  /**
   * 分组结束
   */
  groupEnd(): void {
    console.groupEnd()
  }

  /**
   * 输出空行
   */
  newLine(): void {
    console.log()
  }
}

// 导出单例
export const logger = new Logger()


