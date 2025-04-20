// Patch for content.js crypto.randomUUID error
(function() {
  console.log('Initializing content.js patch for crypto.randomUUID');
  
  // Function to generate a UUID v4
  function uuidv4() {
    try {
      // Use crypto.getRandomValues if available (more secure)
      if (window.crypto && window.crypto.getRandomValues) {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
      } else {
        // Fallback to Math.random
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
  
  // Fix for runtime.lastError message port closed issues
  function fixRuntimeLastError() {
    // Check if we're in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      const originalAddListener = chrome.runtime.onMessage.addListener;
      
      // Replace the original addListener with our patched version
      chrome.runtime.onMessage.addListener = function(callback) {
        // Wrap the callback to ensure it properly handles async responses
        const wrappedCallback = function(message, sender, sendResponse) {
          try {
            // Call the original callback
            const result = callback(message, sender, sendResponse);
            
            // If the callback returns true (indicating async response)
            // but doesn't call sendResponse within a reasonable time,
            // we'll call it with an empty response to prevent the error
            if (result === true) {
              // Set a timeout to call sendResponse if it hasn't been called
              const timeoutId = setTimeout(() => {
                try {
                  console.log('Preventing runtime.lastError by sending empty response');
                  sendResponse({});
                } catch (e) {
                  // Ignore errors, the port might already be closed
                }
              }, 5000); // 5 seconds timeout
              
              // Create a wrapped sendResponse that clears the timeout
              const originalSendResponse = sendResponse;
              sendResponse = function(response) {
                clearTimeout(timeoutId);
                try {
                  return originalSendResponse(response);
                } catch (e) {
                  console.log('Error in sendResponse, port might be closed:', e);
                  return false;
                }
              };
            }
            
            return result;
          } catch (e) {
            console.error('Error in message listener:', e);
            // Ensure we don't leave hanging promises
            try {
              sendResponse({ error: e.message });
            } catch (sendError) {
              // Ignore errors in sendResponse
            }
            return false;
          }
        };
        
        // Add our wrapped callback
        return originalAddListener.call(chrome.runtime.onMessage, wrappedCallback);
      };
      
      console.log('Patched chrome.runtime.onMessage.addListener to prevent runtime.lastError');
    }
  }
  
  // Patch the specific function that's failing
  // This will run after content.js is loaded
  window.addEventListener('load', function() {
    // Apply crypto.randomUUID polyfill
    if (typeof window !== 'undefined') {
      if (!window.crypto) {
        window.crypto = {};
      }
      
      if (!window.crypto.randomUUID) {
        window.crypto.randomUUID = function() {
          return uuidv4();
        };
      }
    }
    
    // Fix runtime.lastError issues
    fixRuntimeLastError();
    
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
        
        console.log('content.js patch applied');
      } catch (e) {
        console.error('Error applying content.js patch:', e);
      }
    }, 1000);
  });
})();
