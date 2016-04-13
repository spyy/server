'use strict'

var ltx = require('node-xmpp-core').ltx
var PushServer =require('./lib/S2S/PushServer')
var r = new PushServer(5269, '0.0.0.0')

var rawmsg = "<message to='mu@example.com' from='juliet@nodexmpp.com/balcony' "
rawmsg = rawmsg + "type='chat' xml:lang='en'><body>Wherefore art thou, mu?</body></message>"

r.register('ec2-52-58-37-243.eu-central-1.compute.amazonaws.com', function (stanza) {
  console.log('GOT YA << ' + stanza.toString())
  console.info('GOT YA << ' + stanza.toString())
  if (stanza.attrs.type !== 'error') {
    var me = stanza.attrs.to
    stanza.attrs.to = stanza.attrs.from
    stanza.attrs.from = me
    //r.send(stanza)
  }
})

var msg = ltx.parse(rawmsg)
