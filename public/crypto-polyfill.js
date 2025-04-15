// Polyfill for crypto.randomUUID
(function() {
  console.log('Initializing crypto.randomUUID polyfill');
  
  // Function to generate a UUID v4 (RFC4122 compliant)
  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  
  // Ensure crypto object exists
  if (typeof window !== 'undefined') {
    if (!window.crypto) {
      window.crypto = {};
    }
    
    // Only add randomUUID if it doesn't exist
    if (!window.crypto.randomUUID) {
      try {
        Object.defineProperty(window.crypto, 'randomUUID', {
          value: uuidv4,
          writable: false,
          configurable: true,
          enumerable: true
        });
        console.log('crypto.randomUUID polyfill applied');
      } catch (e) {
        console.error('Failed to define randomUUID property:', e);
        
        // Fallback: try to set it directly
        try {
          window.crypto.randomUUID = uuidv4;
          console.log('crypto.randomUUID polyfill applied via direct assignment');
        } catch (e2) {
          console.error('Failed to set randomUUID directly:', e2);
        }
      }
    }
    
    // Add a global function as a last resort
    if (!window.randomUUID) {
      window.randomUUID = uuidv4;
      console.log('Global randomUUID function added as fallback');
    }
  }
})();
