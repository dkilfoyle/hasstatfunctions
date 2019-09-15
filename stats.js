exports.median = function(valuesIn) {
  var values = [...valuesIn];
  values.sort((a, b) => {
    return a - b;
  });

  if (values.length === 0) return 0;

  var half = Math.floor(values.length / 2);

  if (values.length % 2) {
    return values[half];
  } else {
    return (values[half - 1] + values[half]) / 2.0;
  }
};

exports.percent = function(x) {
  if (isNaN(x)) return "-";
  return Math.round(x * 100).toString() + "%";
};

exports.quantile = function(arr, q) {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

exports.percentRank = function(array, n) {
  var L = 0;
  var S = 0;
  var N = array.length;

  for (var i = 0; i < array.length; i++) {
    if (array[i] < n) {
      L += 1;
    } else if (array[i] === n) {
      S += 1;
    }
  }

  var pct = (L + 0.5 * S) / N;

  return pct;
};
