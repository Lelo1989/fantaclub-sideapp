const PREFIX = '[FC]';

function isDebugEnabled(): boolean {
  if (typeof window !== 'undefined') {
    return Boolean((window as unknown as { FC_DEBUG?: boolean }).FC_DEBUG);
  }
  return process.env.NEXT_PUBLIC_DEBUG === '1';
}

export function debug(...args: unknown[]) {
  if (isDebugEnabled()) {
    console.debug(PREFIX, ...args);
  }
}

export function info(...args: unknown[]) {
  console.info(PREFIX, ...args);
}

export function warn(...args: unknown[]) {
  console.warn(PREFIX, ...args);
}

export function error(...args: unknown[]) {
  console.error(PREFIX, ...args);
}

const logger = { debug, info, warn, error };
export default logger;
