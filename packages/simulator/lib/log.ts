import chalk from 'chalk'
import { ReplaySubject } from 'rxjs'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const logLevelIsAtLeastDebug = LOG_LEVEL.toUpperCase() === 'DEBUG'
const logLevelIsAtLeastInfo =
  LOG_LEVEL.toUpperCase() === 'INFO' || logLevelIsAtLeastDebug
const logLevelIsAtLeastWarn =
  LOG_LEVEL.toUpperCase() === 'WARN' || logLevelIsAtLeastInfo

const logStream = new ReplaySubject<string>(10)

const print = (
  logFn: (...args: any[]) => void,
  titleFn: (text: string) => string,
  messageFn: (text: string) => string,
  title: string,
  message: string,
  data?: any,
  ...rest: any[]
): void => {
  if (data) {
    logFn(
      titleFn(title),
      messageFn(message),
      data instanceof Error ? data : JSON.stringify(data, null, 2),
      ...rest
    )
  } else {
    logFn(titleFn(title), messageFn(message), ...rest)
  }
}

const debug = (message: string, data?: any, ...rest: any[]) => {
  if (logLevelIsAtLeastDebug) {
    print(
      console.debug,
      chalk.blue,
      chalk.white,
      'DEBUG',
      message,
      data,
      ...rest
    )
    logStream.next(`DEBUG: ${message}`)
  }
}

const info = (message: string, data?: any, ...rest: any[]) => {
  if (logLevelIsAtLeastInfo) {
    print(
      console.info,
      chalk.green,
      chalk.white,
      'INFO',
      message,
      data,
      ...rest
    )
    logStream.next(`INFO: ${message}`)
  }
}

const warn = (message: string, data?: any, ...rest: any[]) => {
  if (logLevelIsAtLeastWarn) {
    print(
      console.warn,
      chalk.yellow,
      chalk.white,
      'WARN',
      message,
      data,
      ...rest
    )
    logStream.next(`WARN: ${message}`)
  }
}

const error = (message: string, data?: any, ...rest: any[]) => {
  print(console.error, chalk.red, chalk.white, 'ERROR', message, data, ...rest)
  logStream.next(`ERROR: ${message}`)
}

const write = (message: string) => {
  console.log(message)
  logStream.next(message)
}

export { logStream, debug, error, info, warn, write }
