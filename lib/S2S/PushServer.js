'use strict'

var net = require('net')
var crypto = require('crypto')
var rack = require('hat').rack
var JID = require('node-xmpp-core').JID
var DomainContext = require('./domaincontext')
var nameprep = require('./util/nameprep')
var dialbackkey = require('./util/dialbackkey')
var IncomingServer = require('./session/incoming')
var debug = require('debug')('xmpp:s2s:pushserver')


function PushServer (s2sPort, bindAddress, opts) {
  this.ctxs = {}
  opts = opts || {}

  this.generateId = rack(opts.idBits, opts.idBitsBase, opts.idBitsExpandBy)

  // start tcp socket
  net.createServer(function (socket) {
    this.acceptConnection(socket)
  }.bind(this)).listen(s2sPort || 5269, bindAddress || '::')
}


// Defaults
PushServer.prototype.rateLimit = 100 // 100 KB/s, it's S2S after all
PushServer.prototype.maxStanzaSize = 65536 // 64 KB, by convention
PushServer.prototype.keepAlive = 30 * 1000 // 30s
PushServer.prototype.streamTimeout = 5 * 60 * 1000 // 5min
PushServer.prototype.credentials = {} // TLS credentials per domain


/*
 * handles a new socket connection
 */
PushServer.prototype.acceptConnection = function (socket) {
  debug('accept a new connection' + socket)
  var self = this

  var inStream = new IncomingServer({
    streamId: this.generateId(),
    reconnect: false,
    socket: socket
  })

  // stanza
  inStream.on('stanza', function (stanza) {
    self.stanzaListener(stanza)
  })

  // incoming connection wants to get verified
  inStream.on('dialbackKey', function (from, to, key) {
    from = nameprep(from)
    to = nameprep(to)
    if (self.hasContext(to)) {
      inStream.send(dialbackkey.dialbackResult(to, from, true))
    } else {
      inStream.error('host-unknown', to + ' is not served here')
    }
  })
}

/**
 * Create domain context & register a stanza listener callback
 */
PushServer.prototype.register = function (domain, listener) {
  domain = nameprep(domain)
  debug('register a new domain: ' + domain)
  this.getContext(domain)
  this.stanzaListener = listener
}

/**
 * Unregister a context and stop its connections
 */
PushServer.prototype.unregister = function (domain) {
  debug('unregister a domain: ' + domain)
  if (this.hasContext(domain)) {
    this.ctxs[domain].end()

    delete this.ctxs[domain]
  }
}

PushServer.prototype.hasContext = function (domain) {
  return this.ctxs.hasOwnProperty(domain)
}

PushServer.prototype.getContext = function (domain) {
  if (this.ctxs.hasOwnProperty(domain)) {
    return this.ctxs[domain]
  } else {
    this.ctxs[domain] = new DomainContext(this, domain)
    return this.ctxs[domain]
  }
}

module.exports = PushServer
