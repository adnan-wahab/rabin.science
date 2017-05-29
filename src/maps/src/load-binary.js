d3.request('data/weather.bin')
  .responseType('arraybuffer')
  .on('load', function (req) { parseData(req.response) })
  .on('error', reject)
  .get();
function parseData(buffer) {
  var bufferData = new Uint16Array(buffer);
  var hours = 72;
  var components = 3;
  var l = bufferData.length / (hours * components);
  var hourlyData = Array(hours);

  for (var i = 0; i < hours; ++i) {
    hourlyData[i] = createHourlyData(bufferData, i, l, hours, components);
  }

  return hourlyData;
}


function createHourlyData(bufferData, i, l, hours, components) {
  var len = bufferData.length;
  var array = Array(l);

  for (var j = i * components, count = 0; count < l; j += hours * components) {
    array[count++] = new Float32Array([bufferData[j], bufferData[j + 1], bufferData[j + 2]]);
  }

  return array;
}


function reject(error) {}
