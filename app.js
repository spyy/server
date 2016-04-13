'use strict'

var PushServer = require('./lib/S2S/PushServer')
var r = new PushServer(5269, '0.0.0.0')
var debug = require('debug')('push:app')


r.register('ec2-52-58-37-243.eu-central-1.compute.amazonaws.com', function (stanza) {
  debug(stanza.toString())
  if (stanza.attrs.type !== 'error') {
    var me = stanza.attrs.to + '/morko'
    stanza.attrs.to = stanza.attrs.from
    stanza.attrs.from = me
  }
})

