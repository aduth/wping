# wping

[![Build Status](https://travis-ci.org/aduth/wping.svg?branch=master)](https://travis-ci.org/aduth/wping)

wping is a zero-dependency WordPress nonce refresh utility weighing in at less than 600 bytes. It works both in the browser and in Node. In typical usage, it's plug-and-play, detecting and updating the nonce value of [the `wpApiSettings` window global](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/) assigned when using either the [Backbone client](https://developer.wordpress.org/rest-api/using-the-rest-api/backbone-javascript-client/) or `wp-api-request` scripts.

## Getting Started

Enqueue the script in your theme or plugin, localizing with `wpApiSettings` if you're not already using `wp-api` or `wp-api-request` client scripts.

```php
function myplugin_enqueue_scripts() {
	wp_enqueue_script( 'wping', 'https://unpkg.com/wping/dist/wping.min.js' );
	wp_localize_script( 'wping', 'wpApiSettings', array(
		'apiRoot' => esc_url_raw( rest_url() ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
	) );
}
add_action( 'wp_enqueue_scripts', 'myplugin_enqueue_scripts' );
```

_Note:_ The above example references wping by CDN. You may instead want to [download the file](https://unpkg.com/wping/dist/wping.min.js) to your theme or plugin directory and update the URL reference accordingly.

When using in a Node.js context, the default export is the `wping` function:

```js
import wping from 'wping';
```

## Usage

Using the [Getting Started](#getting-started) theme code, you're all set! There's nothing else to do. The `wpApiSettings.nonce` value will be updated automatically.

In all other cases, you can configure your own behavior to occur when the nonce is refreshed, or change the settings for refreshing the nonce.

```js
wping( callback: Function, options: Object )
```

**Example:**

```js
var nonce = window._initialNonce;
wping( function( error, nextNonce ) {
	if ( ! error ) {
		nonce = nextNonce;
	}
}, {
	nonce: nonce,
	delay: 5000,
	apiRoot: 'https://example.com/path/to/rest-api'
} );
```

The callback is a Node-style callback function, receiving an error as the first argument if the refresh was unsuccessful, and the next nonce value as the second argument.

**Options:**

- `nonce` (`string`): Initial nonce to use for refresh.
- `delay` (`number`): Time to elapse before refreshing nonce. Defaults to 12 hours, to occur in second tick of default nonce lifetime.
- `apiRoot` (`string`): Root URL of the WordPress REST API.

## License

Copyright 2018 Andrew Duthie

Released under the [MIT License](https://github.com/aduth/wping/tree/master/LICENSE.md).
