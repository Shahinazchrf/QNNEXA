// utils/concurrencyManager.js
class ConcurrencyManager {
  constructor() {
    this.locks = new Map();
    this.timeouts = new Map();
  }

  async acquireLock(key, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const checkLock = () => {
        if (!this.locks.has(key)) {
          this.locks.set(key, true);
          
          // Auto-release après timeout
          this.timeouts.set(key, setTimeout(() => {
            this.releaseLock(key);
          }, timeout));
          
          resolve(true);
        } else {
          setTimeout(checkLock, 100);
        }
      };
      checkLock();
    });
  }

  releaseLock(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    this.locks.delete(key);
  }
}

module.exports = new ConcurrencyManager();