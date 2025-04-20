"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomUUID = void 0;
exports.generateUUID = generateUUID;
const uuid_1 = require("uuid");
/**
 * Generate a UUID using the uuid library
 * This is a wrapper to ensure consistent UUID generation across the application
 * and avoid issues with crypto.randomUUID not being available in some environments
 */
function generateUUID() {
    return (0, uuid_1.v4)();
}
/**
 * Polyfill for crypto.randomUUID
 * This ensures that code expecting crypto.randomUUID will still work
 */
if (typeof window !== 'undefined') {
    if (!window.crypto) {
        // @ts-ignore - Create crypto object if it doesn't exist
        window.crypto = {};
    }
    if (!window.crypto.randomUUID) {
        // @ts-ignore - Add the randomUUID method to the crypto object
        window.crypto.randomUUID = () => (0, uuid_1.v4)();
        console.log('Added crypto.randomUUID polyfill');
    }
}
// Export the polyfill function directly for use in other modules
const randomUUID = () => (0, uuid_1.v4)();
exports.randomUUID = randomUUID;
//# sourceMappingURL=uuid.js.map