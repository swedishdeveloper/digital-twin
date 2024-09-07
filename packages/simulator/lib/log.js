import chalk from 'chalk';
import { ReplaySubject } from 'rxjs';

const LOG_LEVEL: string = process.env.LOG_LEVEL || 'info';

const logLevelIsAtLeastDebug: boolean = LOG_LEVEL.toUpperCase() === 'DEBUG';
const logLevelIsAtLeastInfo: boolean =
  LOG_LEVEL.toUpperCase() === 'INFO' || logLevelIsAtLeastDebug;
const logLevelIsAtLeastWarn: boolean =
  LOG_LEVEL.toUpperCase() === 'WARN' || logLevelIsAtLeastInfo;

const logStream = new ReplaySubject<string>(10);

const print = (
  logFn: (...args: any[]) => void,
  titleFn: (text: string) => string,
  messageFn: (text: string) => string,
  title: string,
  message: string,
  data?: any,
  ...rest: any[]
) => {
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

export const logStream = logStream;
export const debug = (message: string, data?: any, ...rest: any[]) => {
  if (logLevelIsAtLeastDebug) {
    print(
      console.debug,
      chalk.whiteBright.bold,
      chalk.gray,
      'DEBUG',
      message,
      data,
      ...rest
    );
  }
};

export const error = (title: string, error: any, ...rest: any[]) => {
  print(
    console.error,
    chalk.redBright.bold,
    chalk.red,
    'ERROR',
    title,
    error,
    ...rest
  );
};

export const info = (message: string, data?: any, ...rest: any[]) => {
  logStream.next(
    message + ' ' + [data, ...rest].map((x) => JSON.stringify(x)).join(' ')
  );

  if (logLevelIsAtLeastInfo) {
    print(
      console.log,
      chalk.whiteBright.bold,
      chalk.white,
      'INFO ',
      message,
      data,
      ...rest
    );
  }
};

export const warn = (message: string, data?: any, ...rest: any[]) => {
  if (logLevelIsAtLeastWarn) {
    print(
      console.log,
      chalk.red.bold,
      chalk.white,
      'WARN ',
      message,
      data,
      ...rest
    );
  }
};

export const write = (data: string) => {
  if (logLevelIsAtLeastDebug) {
    process.stdout.write(data);
  }
};
  logStream,
  debug: (message, data, ...rest) => {
    if (logLevelIsAtLeastDebug) {
      print(
        console.debug,
        chalk.whiteBright.bold,
        chalk.gray,
        'DEBUG',
        message,
        data,
        ...rest
      )
    }
  },
  error: (title, error, ...rest) => {
    print(
      console.error,
      chalk.redBright.bold,
      chalk.red,
      'ERROR',
      title,
      error,
      ...rest
    )
  },
  info: (message, data, ...rest) => {
    logStream.next(
      message + ' ' + [data, ...rest].map((x) => JSON.stringify(x)).join(' ')
    )

    if (logLevelIsAtLeastInfo) {
      print(
        console.log,
        chalk.whiteBright.bold,
        chalk.white,
        'INFO ',
        message,
        data,
        ...rest
      )
    }
  },
  warn: (message, data, ...rest) => {
    if (logLevelIsAtLeastWarn) {
      print(
        console.log,
        chalk.red.bold,
        chalk.white,
        'WARN ',
        message,
        data,
        ...rest
      )
    }
  },
  write: (data) => {
    if (logLevelIsAtLeastDebug) {
      process.stdout.write(data)
    }
  },
}
