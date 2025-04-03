// Polyfill for crypto.randomUUID
(function() {
  console.log('Initializing crypto.randomUUID polyfill');
  
  // Function to generate a UUID v4
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Ensure crypto object exists
  if (typeof window !== 'undefined') {
    // Create a completely new crypto object to avoid any issues with existing properties
    const originalCrypto = window.crypto;
    
    // Create a new crypto object with all the original properties
    const newCrypto = {};
    if (originalCrypto) {
      Object.getOwnPropertyNames(originalCrypto).forEach(prop => {
        try {
          newCrypto[prop] = originalCrypto[prop];
        } catch (e) {
          // Some properties might be non-configurable, ignore those
        }
      });
    }
    
    // Add our randomUUID implementation
    newCrypto.randomUUID = uuidv4;
    
    // Replace the original crypto object
    try {
      window.crypto = newCrypto;
      console.log('crypto.randomUUID polyfill applied');
    } catch (e) {
      console.error('Failed to replace crypto object:', e);
      
      // Fallback: try to define the property directly
      try {
        Object.defineProperty(window.crypto, 'randomUUID', {
          value: uuidv4,
          writable: true,
          configurable: true,
          enumerable: true
        });
        console.log('crypto.randomUUID polyfill applied via defineProperty');
      } catch (e2) {
        console.error('Failed to define randomUUID property:', e2);
      }
    }
    
    // Add a global function as a last resort
    window.randomUUID = uuidv4;
    console.log('Global randomUUID function added as fallback');
  }
})();
