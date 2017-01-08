'use strict';
// Import the interface to Tessel hardware
const Tessel = require('tessel-io');
const five = require('johnny-five');
const board = new five.Board({
  io: new Tessel(),
  repl: false
});
// Modules for web access
const os = require('os');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
// Serve static resources to client
app.use(express.static(path.join(__dirname, '/app')));
app.use('/vendor', express.static(__dirname + '/node_modules/'));

board.on('ready', () => {
  const clients = new Set();
  const monitor = new five.Multi({
    controller: 'BME280',
    elevation: 2
  })
  const light = new five.Light('a7')
  const led = new five.Led('l1')

  var updated = Date.now() - 1000;
  monitor.on('change', () => {
    const now = Date.now();
    if (now - updated >= 1000) {
      updated = now;

      clients.forEach(recipient => {
        recipient.emit('report',
        [
          now,
          monitor.thermometer.fahrenheit,
          monitor.barometer.pressure,
          monitor.hygrometer.relativeHumidity,
          monitor.altimeter.meters,
          light.level*100
        ]);
      });
    }
  });

  io.on('connection', socket => {
    // Allow up to 5 monitor sockets to
    // connect to this enviro-monitor server
    if (clients.size < 5) {
      clients.add(socket);
      console.log('New client added');
      // When the socket disconnects, remove
      // it from the recipient set.
      socket.on('disconnect', () => {
        clients.delete(socket)
        console.log('Client disconnected');
      });
    }
  });

  server.listen(80, () => {
    console.log('Listening at ' + os.networkInterfaces().wlan0[0].address)
    led.blink() // Indicate that the server is running
  });

  board.on('exit', () => {
    server.close()
    led.off()
  });
});
