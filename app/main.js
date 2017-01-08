window.onload = function() {
  var socket = io();
  var stream = [[new Date,null,null,null,null,null]];

  var g = new Dygraph(
    document.getElementById('div_g'), stream, {
      drawPoints: true,
      title: 'Environmental Sensor Data',
      legend: 'always',
      labelsDiv: document.getElementById('legend'),
      labels: [
        'Time',
        'Temperature (ºF)',
        'Pressure (kPa)',
        'Humidity (%)',
        'Altimeter (m)',
        'Light (%)'
      ]
    });


  socket.on('report', function (monitor) {
    monitor[0] = new Date(monitor[0]); // Convert back to a date
    stream.push(monitor)
    g.updateOptions( { 'file': stream } );
    if (stream.length>60) {
      stream.shift() // Only keep last 60 values
    }
  });
};
