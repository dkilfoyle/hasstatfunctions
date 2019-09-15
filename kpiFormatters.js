const { percent } = require("./stats");

function kpiToHTML(metTarget, denominator, target, compare) {
  var prop = metTarget / denominator;
  var percentTxt = percent(prop);
  var tcolor = "black";
  if (compare === ">") {
    if (prop > target) {
      tcolor = "green";
    } else if (prop > 0.8 * target) {
      tcolor = "darkorange";
    } else {
      tcolor = "red";
    }
  } else {
    if (prop < target) {
      tcolor = "green";
    } else if (prop < 1.2 * target) {
      tcolor = "darkorange";
    } else {
      tcolor = "red";
    }
  }
  return `<span style="color:${tcolor};font-size:15px">${percentTxt} (${metTarget}/${denominator})</span>`;
}

function timeToHTML(time) {
  // var tcolor = 'black'
  // if (compare === '>') {
  //   if (time > target) {
  //     tcolor = 'green'
  //   } else if (time > 0.8 * target) {
  //     tcolor = 'darkorange'
  //   } else {
  //     tcolor = 'red'
  //   }
  // } else {
  //   if (time < target) {
  //     tcolor = 'green'
  //   } else if (time < 1.2 * target) {
  //     tcolor = 'darkorange'
  //   } else {
  //     tcolor = 'red'
  //   }
  // }
  return `<span style="font-size:15px">${time}</span>`;
}

module.exports = {
  kpiToHTML,
  timeToHTML
};
