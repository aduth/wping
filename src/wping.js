var callbacks, DEFAULT_OPTIONS, currentOptions, nonce, apiSettings;

/**
 * Callbacks to invoke when nonce has been received.
 *
 * @type {Function[]}
 */
callbacks = [];

/**
 * Default options to use if not provided via options argument.
 *
 * @type {Object}
 */
DEFAULT_OPTIONS = {
	delay: 43200000,
	apiRoot: '/wp-json',
};

/**
 * Root callback when refresh complete, responsible for updating the current
 * nonce and invoking all registered callbacks.
 *
 * @param {?Error}  error     Error, if failed.
 * @param {?string} nextNonce Next nonce, if succeeded.
 *
 * @return {void}
 */
function onNextNonceReceived( error, nextNonce ) {
	var i;

	if ( nextNonce ) {
		nonce = nextNonce;
	}

	for ( i = 0; i < callbacks.length; i++ ) {
		// Pass whatever is known to be the current nonce to the callback, even
		// if an error, in case implementer is careless in use of the nonce.
		callbacks[ i ]( error, nonce );
	}
}

/**
 * Triggers request for nonce refresh.
 *
 * @param {Function} callback Callback to invoke when complete.
 *
 * @return {void}
 */
function refreshNonce( callback ) {
	var xhr, url;

	xhr = new XMLHttpRequest();

	function handleError( status, statusText ) {
		var error = new Error( statusText );
		error.status = status;
		callback( error );
	}

	xhr.onload = function() {
		if ( this.status === 200 ) {
			callback( null, this.getResponseHeader( 'X-WP-Nonce' ) );
		} else {
			handleError( this.status, this.statusText );
		}
	};

	xhr.onerror = function() {
		handleError( this.status, this.statusText );
	};

	url = currentOptions.apiRoot;
	xhr.open( 'GET', url );

	xhr.setRequestHeader( 'X-WP-Nonce', nonce );

	// Override method as HEAD to avoid unnecessary processing and to reduce
	// response size, as we only care about the response nonce header.
	xhr.setRequestHeader( 'X-HTTP-Method-Override', 'HEAD' );

	xhr.send();
}

/**
 * Start a recurring refresh of WordPress nonce via REST API.
 *
 * @param {Function} callback        Node-style callback to trigger when nonce
 *                                   refresh has completed, passed the error
 *                                   and current nonce as arguments.
 * @param {?Object}  options         Request options.
 * @param {string}   options.nonce   Initial nonce to use for refresh.
 * @param {number}   options.delay   Time to elapse before refreshing nonce.
 *                                   Defaults to 12 hours, to occur in second
 *                                   tick of default nonce lifetime.
 * @param {string}   options.apiRoot Root URL of the WordPress REST API.
 *
 * @return {?number} Timeout ID, if created.
 */
function wping( callback, options ) {
	var key;

	if ( ! options ) {
		options = {};
	}

	if ( options.nonce ) {
		nonce = options.nonce;
	}

	// At this point, we should have a nonce available to be able to proceed.
	if ( ! nonce ) {
		// eslint-disable-next-line no-console
		console.warn( 'Unable to poll, initial nonce is not set.' );
		return;
	}

	if ( typeof callback === 'function' ) {
		callbacks.push( callback );
	}

	// Set default options
	for ( key in DEFAULT_OPTIONS ) {
		if ( ! options.hasOwnProperty( key ) ) {
			options[ key ] = DEFAULT_OPTIONS[ key ];
		}
	}

	if ( currentOptions && currentOptions.delay !== options.delay ) {
		// We delete the known timeout so we can proceed with creating a new
		// one, though we do not clear the existing schedule. If a consumer
		// desires to do so, they must clear before calling with new schedule.
		delete wping.timeout;
	}

	// Update current options
	currentOptions = options;

	// Only a single timeout should occur at a given time, so abort after
	// adding the callback.
	if ( wping.timeout ) {
		return;
	}

	wping.timeout = setInterval(
		refreshNonce.bind( null, onNextNonceReceived ),
		options.delay
	);

	return wping.timeout;
}

// Expose callbacks as escape hatch for modifying (unlikely).
wping.callbacks = callbacks;

// If we can find API settings in global scope, automatically start a refresh
// and assign new nonce into apiSettings on success.
apiSettings = global.wpApiSettings;
if ( apiSettings && apiSettings.nonce ) {
	wping( function( error, nextNonce ) {
		if ( ! error ) {
			apiSettings.nonce = nextNonce;
		}
	}, apiSettings );
}

module.exports = wping;
