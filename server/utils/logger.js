// server/utils/logger.js
const debugPrefix = '[movies-api]';

function info(...args) {
    console.info(debugPrefix, ...args);
}

function error(...args) {
    console.error(debugPrefix, ...args);
}

module.exports = { info, error };
