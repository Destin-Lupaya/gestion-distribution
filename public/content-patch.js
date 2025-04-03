// Patch for content.js crypto.randomUUID error
(function() {
  console.log('Initializing content.js patch for crypto.randomUUID');
  
  // Function to generate a UUID v4
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Patch the specific function that's failing
  // This will run after content.js is loaded
  window.addEventListener('load', function() {
    // Wait a bit to ensure content.js has loaded
    setTimeout(function() {
      try {
        // Try to find the _s function in content.js that's failing
        if (typeof window._s === 'function') {
          console.log('Found _s function, patching...');
          const originalFunction = window._s;
          window._s = function() {
            try {
              return originalFunction.apply(this, arguments);
            } catch (e) {
              if (e.message && e.message.includes('crypto.randomUUID is not a function')) {
                console.log('Caught crypto.randomUUID error, using fallback');
                return uuidv4();
              }
              throw e;
            }
          };
        }
        
        // Add the function to the global scope as a last resort
        window.crypto = window.crypto || {};
        window.crypto.randomUUID = window.crypto.randomUUID || uuidv4;
        
        console.log('content.js patch applied');
      } catch (e) {
        console.error('Error applying content.js patch:', e);
      }
    }, 1000);
  });
})();
