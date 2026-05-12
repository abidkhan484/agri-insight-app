import log from 'loglevel';

if (import.meta.env.DEV) {
  log.setLevel('debug');
} else {
  log.setLevel('warn');
}

export default log;
