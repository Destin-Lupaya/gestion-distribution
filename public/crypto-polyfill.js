// Polyfill for crypto.randomUUID
(function() {
  console.log('Initializing crypto.randomUUID polyfill');
  
  // Function to generate a UUID v4 (RFC4122 compliant)
  function uuidv4() {
    try {
      // Use crypto.getRandomValues if available (more secure)
      if (window.crypto && window.crypto.getRandomValues) {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
      } else {
        // Fallback to Math.random if crypto.getRandomValues is not available
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0,
              v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    } catch (e) {
      console.error('Error generating UUID:', e);
      // Ultimate fallback
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }
  
  // Ensure crypto object exists
  if (typeof window !== 'undefined') {
    if (!window.crypto) {
      try {
        Object.defineProperty(window, 'crypto', {
          value: {},
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch (e) {
        console.error('Failed to create crypto object:', e);
        window.crypto = {};
      }
    }
    
    // Only add randomUUID if it doesn't exist
    if (!window.crypto.randomUUID) {
      try {
        Object.defineProperty(window.crypto, 'randomUUID', {
          value: function() {
            return uuidv4();
          },
          writable: false,
          configurable: true,
          enumerable: true
        });
        console.log('crypto.randomUUID polyfill applied');
      } catch (e) {
        console.error('Failed to define randomUUID property:', e);
        
        // Fallback: try to set it directly
        try {
          window.crypto.randomUUID = function() {
            return uuidv4();
          };
          console.log('crypto.randomUUID polyfill applied via direct assignment');
        } catch (e2) {
          console.error('Failed to set randomUUID directly:', e2);
        }
      }
    }
    
    // Add a global function as a last resort
    if (!window.randomUUID) {
      window.randomUUID = function() {
        return uuidv4();
      };
      console.log('Global randomUUID function added as fallback');
    }
    
    // Patch any existing functions that might be using crypto.randomUUID
    if (window.crypto && window.crypto.randomUUID) {
      // Make sure the function is callable
      const testUUID = window.crypto.randomUUID();
      if (testUUID && typeof testUUID === 'string' && testUUID.length > 30) {
        console.log('crypto.randomUUID is working correctly');
      } else {
        console.warn('crypto.randomUUID did not return a valid UUID, re-applying polyfill');
        window.crypto.randomUUID = function() {
          return uuidv4();
        };
      }
    }
  }
})();
