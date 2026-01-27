const ConsoleMonitor = require('./src/utils/consoleMonitor');

// Check if ConsoleMonitor is exported as default or named
if (ConsoleMonitor && typeof ConsoleMonitor === 'function') {
  const monitor = new ConsoleMonitor();
  monitor.start();
} else if (ConsoleMonitor.default) {
  const monitor = new ConsoleMonitor.default();
  monitor.start();
} else {
  console.error('ConsoleMonitor not found or invalid');
}
