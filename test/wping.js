/* eslint-disable no-console */

const assert = require( 'assert' );
const sinon = require( 'sinon' );
const wping = require( '../src/wping' );

global.XMLHttpRequest = function() {};
global.XMLHttpRequest.prototype = {
	open: sinon.stub()
		.callsFake( function( method, url ) {
			this.url = url;
		} ),
	send: sinon.stub()
		.callsFake( function() {
			switch ( this.url ) {
				case '/wp-json':
					this.status = 200;
					this.statusText = 'OK';
					break;

				case '/forbidden':
					this.status = 403;
					this.statusText = 'Forbidden';
					break;
			}

			this.onload();
		} ),
	setRequestHeader: sinon.stub(),
	getResponseHeader: sinon.stub()
		.withArgs( 'X-WP-Nonce' )
		.returns( '--new--' ),
	onload: sinon.stub(),
	onerror: sinon.stub(),
};

describe( 'wping', () => {
	before( () => {
		sinon.stub( console, 'warn' );
		sinon.stub( global, 'setInterval' )
			.callsArgAsync( 0 )
			.returns( 1 );
	} );

	beforeEach( () => {
		// eslint-disable-next-line no-empty
		while ( wping.callbacks.shift() ) {}
		console.warn.resetHistory();
		setInterval.resetHistory();
		delete wping.timeout;
	} );

	after( () => {
		console.warn.restore();
		setInterval.restore();
	} );

	it( 'should warn if no initial nonce', () => {
		const intervalId = wping();

		sinon.assert.calledOnce( console.warn );
		assert.equal( intervalId, undefined );
		assert.equal( wping.timeout, undefined );
	} );

	it( 'should start refreshing', ( done ) => {
		const intervalId = wping( function( error, nextNonce ) {
			assert.equal( nextNonce, '--new--' );

			done( error );
		}, {
			nonce: '--nonce--',
		} );

		assert.ok( intervalId );
		assert.ok( wping.timeout );
	} );

	it( 'should include error if failed', ( done ) => {
		wping( function( error, nextNonce ) {
			assert.equal( error.status, 403 );
			assert.equal( error.message, 'Forbidden' );
			assert.equal( nextNonce, '--nonce--' );

			done();
		}, {
			nonce: '--nonce--',
			apiRoot: '/forbidden',
		} );
	} );

	it( 'calls multiple callbacks', ( done ) => {
		const callback = sinon.stub().onCall( 1 ).callsFake( done );

		const options = {
			nonce: '--nonce--',
		};

		wping( callback, options );
		wping( callback, options );
	} );

	it( 'schedules concurrent callbacks', () => {
		wping( () => {}, {
			nonce: '--nonce--',
			delay: 1,
		} );

		wping( () => {}, {
			nonce: '--nonce--',
			delay: 2,
		} );

		sinon.assert.calledTwice( setInterval );
	} );
} );
