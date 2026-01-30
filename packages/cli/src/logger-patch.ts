
// Patches the global console object to prepend timestamps
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalInfo = console.info;

function getTimestamp() {
    return new Date().toISOString();
}

console.log = function (...args: any[]) {
    originalLog.apply(console, [`[${getTimestamp()}]`, ...args]);
};

console.warn = function (...args: any[]) {
    originalWarn.apply(console, [`[${getTimestamp()}]`, ...args]);
};

console.error = function (...args: any[]) {
    originalError.apply(console, [`[${getTimestamp()}]`, ...args]);
};

console.info = function (...args: any[]) {
    originalInfo.apply(console, [`[${getTimestamp()}]`, ...args]);
};

export { };
