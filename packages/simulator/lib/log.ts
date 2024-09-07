import chalk from 'chalk';
import { ReplaySubject } from 'rxjs';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logLevelIsAtLeastDebug = LOG_LEVEL.toUpperCase() === 'DEBUG';
const logLevelIsAtLeastInfo =
  LOG_LEVEL.toUpperCase() === 'INFO' || logLevelIsAtLeastDebug;
const logLevelIsAtLeastWarn =
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
): void => {
  if (data) {
    logFn(
      titleFn(title),
      messageFn(message),
      data instanceof Error ? data : JSON.stringify(data, null, 2),
      ...rest
    );
  } else {
    logFn(titleFn(title), messageFn(message), ...rest);
  }
};

export { logStream, debug, error, info, warn, write };
