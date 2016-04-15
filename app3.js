'use strict'

var xmpp = require('./index')
var server = null
var Client = require('node-xmpp-client')

var startServer = function (done) {
  // Sets up the server.
  server = new xmpp.C2S.TCPServer({
    port: 5222,
    domain: 'ec2-52-58-37-243.eu-central-1.compute.amazonaws.com'
  })

  // On connection event. When a client connects.
  server.on('connection', function (client) {
    // That's the way you add mods to a given server.

    // Allows the developer to register the jid against anything they want
    client.on('register', function (opts, cb) {
      console.log('REGISTER')
      cb(true)
    })

    // Allows the developer to authenticate users against anything they want.
    client.on('authenticate', function (opts, cb) {
      console.log('server:', opts.username, opts.password, 'AUTHENTICATING')
      if (opts.password === 'secret') {
        console.log('server:', opts.username, 'AUTH OK')
        cb(null, opts)
      } else {
        console.log('server:', opts.username, 'AUTH FAIL')
        cb(false)
      }
    })

    client.on('online', function () {
      console.log('server:', client.jid.local, 'ONLINE')
    })

    // Stanza handling
    client.on('stanza', function (stanza) {
      console.log('server:', client.jid.local, 'stanza', stanza.toString())
      var from = stanza.attrs.from
      stanza.attrs.from = stanza.attrs.to
      stanza.attrs.to = from
      client.send(stanza)
    })

    // On Disconnect event. When a client disconnects
    client.on('disconnect', function () {
      console.log('server:', 'DISCONNECT')
    })
  })

  server.on('listening', done)
}

startServer(function () {
  console.log('server: online')
})

