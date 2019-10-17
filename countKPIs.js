const { getPriorFiscalQuarters } = require("./getPriorDates");
const colormap = require("colormap");
const { percent, percentRank } = require("./stats");
const {
  getTimeframePatients,
  getTimeframeName
} = require("./timeframePatients");
const {
  isAny,
  isIntervention,
  isMimic,
  isDiversion,
  isDHB,
  isHospital,
  isTICI2B3
} = require("./filters");
const { kpiTimeframes } = require("./timeKPIs");
const { kpiToHTML } = require("./kpiFormatters");
const btoa = require("btoa");

function countKPI(config) {
  if (
    config.patients === undefined ||
    config.timeframes === undefined ||
    config.eventFn === undefined
  ) {
    console.error("CountKPI: invalid config", config);
    return [];
  }
  if (config.filterFn === undefined) {
    console.log("CountKPI: no filter defined, setting to isAny", config);
    config.filterFn = isAny;
  }
  if (config.htmlFormatter === undefined) {
    config.htmlFormatter = numerator => numerator.toString();
  }
  if (config.colorFn === undefined) {
    config.colorFn = () => "black"
  }

  var kpis = config.timeframes.map(curTimeframe => {
    // only keep patients within the selected timeframe
    var timePatients = getTimeframePatients(
      config.patients,
      curTimeframe.period,
      curTimeframe.steps
    );
    // only keep the selected subgroup eg DHB or hospital
    var filterPatients = timePatients.filter(config.filterFn);

    // count those with event
    var numerator = filterPatients.reduce(
      (total, pt) => total + config.eventFn(pt),
      0
    ); // coercing pt[event] truthiness to integer
    var denominator1 = timePatients.length;
    var denominator2 = filterPatients.length;

    return {
      timeFrame: getTimeframeName(curTimeframe),
      n: numerator,
      denominator1,
      denominator2,
      prop1: numerator / denominator1,
      prop2: numerator / denominator2,
      percent1: percent(numerator / denominator1),
      percent2: percent(numerator / denominator2),
      // patients: filterPatients.map(pt => pt.ArrivalType),
      html: config.htmlFormatter(numerator, denominator2)
    };
  });
  return kpis;
}

function countTimeframes() {
  return [
    {
      period: "weeks",
      steps: 0
    },
    {
      period: "months",
      steps: 0
    },
    {
      period: "months",
      steps: -1
    },
    {
      period: "calendarYears",
      steps: 0
    },
    {
      period: "calendarYTD",
      steps: -1
    }
  ];
}

function getEvtPerWeek(patients, eventFn, steps) {
  var timeframes = [];
  for (var i = 0; i < steps; i++) {
    timeframes.push({
      period: "weeks",
      steps: -i
    });
  }
  return countKPI({
    patients: patients,
    eventFn: eventFn,
    filterFn: isAny,
    timeframes: timeframes
  }).map(week => week.n);
}

function getEvtPerQuarter(patients, eventFn, steps) {
  var timeframes = [];
  for (var i = 0; i < steps; i++) {
    timeframes.push({
      period: "fiscalQuarters",
      steps: -i
    });
  }
  return countKPI({
    patients: patients,
    eventFn: eventFn,
    filterFn: isAny,
    timeframes: timeframes
  }).map(q => {
    return {
      n: q.n,
      quarter: q.timeFrame
    };
  });
}

function mimicsKPI(patients) {
  return countKPI({
    patients: patients,
    eventFn: isMimic,
    filterFn: isDiversion,
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.25, "<"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.25, "<")
  });
}

function interventionsKPI(patients) {
  return countKPI({
    patients: patients,
    eventFn: isIntervention,
    filterFn: isDiversion,
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.2, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.2, ">")
  });
}

function ticiKPI(patients) {
  return countKPI({
    patients: patients,
    eventFn: isTICI2B3,
    filterFn: pt => pt.PSI && pt.PSIResult,
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.2, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.2, ">")
  });
}

function ivtsichKPI(patients) {
  return countKPI({
    patients: patients,
    eventFn: pt => pt.FollowupCT === "sICH",
    filterFn: pt => pt.ThrombolysedACH,
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.06, "<"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.06, "<")
  });
}

function countAll(patients) {
  var dhbs = ["Any"];
  var counts = {};
  dhbs.forEach(dhb => {
    counts[dhb] = countKPI({
      patients: patients,
      eventFn: isAny,
      filterFn: isDHB(dhb),
      timeframes: countTimeframes()
    }).map(kpi => kpi.n);
  });
  return counts;
}

function countPSI(patients) {
  var dhbs = ["Any", "ADHB", "WDHB", "CMDHB", "NonMetro"];
  var counts = {};
  dhbs.forEach(dhb => {
    counts[dhb] = countKPI({
      patients: patients,
      eventFn: pt => pt.PSI,
      filterFn: isDHB(dhb),
      timeframes: countTimeframes()
    }).map(kpi => kpi.n);
  });
  return counts;
}

function countPSIChart(patients) {
  var dhbs = ["ADHB", "WDHB", "CMDHB", "NonMetro"];
  var counts = {};
  var quarters = [];
  for (var i = 1; i < 13; i++) {
    quarters.push({
      period: "fiscalQuarters",
      steps: -i
    });
  }
  dhbs.forEach(dhb => {
    counts[dhb] = countKPI({
      patients: patients,
      eventFn: pt => pt.PSI,
      filterFn: isDHB(dhb),
      timeframes: quarters
    }).map(kpi => kpi.n);
  });
  return counts;
}

function countIVT(patients) {
  var dhbs = ["Any", "ADHB", "WDHB", "CMDHB"];
  var counts = {};
  dhbs.forEach(dhb => {
    counts[dhb] = countKPI({
      patients: patients,
      eventFn: pt => pt.ThrombolysedACH,
      filterFn: isDHB(dhb),
      timeframes: countTimeframes()
    }).map(kpi => kpi.n);
  });
  return counts;
}

function countIVTChart(patients) {
  var dhbs = ["Any", "ADHB", "WDHB", "CMDHB"];
  var counts = {};
  var quarters = [];
  for (var i = 1; i < 13; i++) {
    quarters.push({
      period: "fiscalQuarters",
      steps: -i
    });
  }
  dhbs.forEach(dhb => {
    counts[dhb] = countKPI({
      patients: patients,
      eventFn: pt => pt.ThrombolysedACH,
      filterFn: isDHB(dhb),
      timeframes: quarters
    }).map(kpi => kpi.n);
  });
  return counts;
}

function countDiversionChart(patients) {
  var hosps = ["NSH", "WTK", "MMH"];
  var counts = {};
  var quarters = [];
  for (var i = 1; i < 13; i++) {
    quarters.push({
      period: "fiscalQuarters",
      steps: -i
    });
  }
  hosps.forEach(hosp => {
    counts[hosp] = countKPI({
      patients: patients,
      eventFn: isDiversion,
      filterFn: isHospital(hosp),
      timeframes: quarters
    }).map(kpi => kpi.n);
  });
  return counts;
}

function countDiversion(patients) {
  var hosps = ["Diversion", "NSH", "WTK", "MMH"];
  var counts = {};
  hosps.forEach(hosp => {
    counts[hosp] = countKPI({
      patients: patients,
      eventFn: isDiversion,
      filterFn: isHospital(hosp),
      timeframes: countTimeframes()
    }).map(kpi => kpi.n);
  });
  return counts;
}

function countMimic(patients) {
  return countKPI({
    patients: patients,
    eventFn: isMimic,
    filterFn: isDiversion,
    timeframes: countTimeframes()
  }).map(kpi => kpi.n);
}

function countIntervention(patients) {
  return countKPI({
    patients: patients,
    eventFn: isIntervention,
    filterFn: isDiversion,
    timeframes: countTimeframes()
  }).map(kpi => kpi.n);
}

function countOvernight(patients) {
  return countKPI({
    patients: patients,
    eventFn: pt => {
      return (
        pt.EDArrivalTime.getHours() > 21 || pt.EDArrivalTime.getHours() < 8
      );
    },
    filterFn: isDiversion,
    timeframes: countTimeframes()
  }).map(kpi => kpi.n);
}

function weeklyReportData(patients) {
  let colors = colormap({
    colormap: "portland",
    nshades: 10,
    format: "hex",
    alpha: 1
  });

  var psi = getEvtPerWeek(patients, pt => pt.PSI, 52);
  var psicolors = psi
    .slice(0, 12)
    .map(x => colors[Math.round(percentRank(psi, x) * 10)])
    .reverse();

  var ivt = getEvtPerWeek(patients, pt => pt.ThrombolysedACH, 52);
  var ivtcolors = ivt
    .slice(0, 12)
    .map(x => colors[Math.round(percentRank(ivt, x) * 10)])
    .reverse();

  var div = getEvtPerWeek(patients, pt => pt.ArrivalType === "Diversion", 52);
  var divcolors = div
    .slice(0, 12)
    .map(x => colors[Math.round(percentRank(div, x) * 10)])
    .reverse();

  return {
    psi: {
      eventsPerWeek: psi.slice(0, 12),
      color: psicolors[11]
    },
    ivt: {
      eventsPerWeek: ivt.slice(0, 12),
      color: ivtcolors[11]
    },
    div: {
      eventsPerWeek: div.slice(0, 12),
      color: divcolors[11]
    }
  }
}

function weeklyReport(patients) {

  const weeklyData = weeklyReportData(patients);

  var chartConfig = function (x) {
    return {
      type: "sparkline",
      data: {
        datasets: [
          {
            backgroundColor: "rgba(255,255,255,0.35)",
            borderColor: "rgba(230,230,230,1)",
            data: x.reverse(),
            lineTension: 0.3,
            borderWidth: 4
            // borderColor: colors
            // pointBorderColor: colors
          }
        ]
      },
      options: {
        elements: {
          point: {
            radius: 5
          }
        }
      }
    };
  };

  return {
    psi: {
      data: weeklyData.psi.eventsPerWeek,
      color: weeklyData.psi.color,
      graph:
        "https://quickchart.io/chart?encoding=base64&c=" +
        btoa(
          JSON.stringify(chartConfig(weeklyData.psi.eventsPerWeek)).replace(
            /"([^(")"]+)":/g,
            "$1:"
          )
        )
    },
    ivt: {
      data: weeklyData.ivt.eventsPerWeek,
      color: weeklyData.ivt.color,
      graph:
        "https://quickchart.io/chart?encoding=base64&c=" +
        btoa(
          JSON.stringify(chartConfig(weeklyData.ivt.eventsPerWeek)).replace(
            /"([^(")"]+)":/g,
            "$1:"
          )
        )
    },
    div: {
      data: weeklyData.div.eventsPerWeek,
      color: weeklyData.div.color,
      graph:
        "https://quickchart.io/chart?encoding=base64&c=" +
        btoa(
          JSON.stringify(chartConfig(weeklyData.div.eventsPerWeek)).replace(
            /"([^(")"]+)":/g,
            "$1:"
          )
        )
    }
  };
}

function quarterCharts(patients) {
  var psicounts = countPSIChart(patients);
  var psiconfig = {
    type: "bar",
    data: {
      labels: getPriorFiscalQuarters(11).reverse(),
      datasets: [
        {
          data: psicounts["NonMetro"].reverse(),
          label: "NonMetro"
        },
        {
          data: psicounts["ADHB"].reverse(),
          label: "ADHB"
        },
        {
          data: psicounts["WDHB"].reverse(),
          label: "WDHB"
        },
        {
          data: psicounts["CMDHB"].reverse(),
          label: "CMDHB"
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "PSI per Quarter"
      },
      scales: {
        xAxes: [
          {
            stacked: true
          }
        ],
        yAxes: [
          {
            stacked: true
          }
        ]
      }
    }
  };
  var ivtcounts = countIVTChart(patients);
  var ivtconfig = {
    type: "bar",
    data: {
      labels: getPriorFiscalQuarters(11).reverse(),
      datasets: [
        {
          data: ivtcounts["ADHB"].reverse(),
          label: "ADHB"
        },
        {
          data: ivtcounts["WDHB"].reverse(),
          label: "WDHB"
        },
        {
          data: ivtcounts["CMDHB"].reverse(),
          label: "CMDHB"
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "IVT per Quarter"
      },
      scales: {
        xAxes: [
          {
            stacked: true
          }
        ],
        yAxes: [
          {
            stacked: true
          }
        ]
      }
    }
  };
  var divcounts = countDiversionChart(patients);
  var divconfig = {
    type: "bar",
    data: {
      labels: getPriorFiscalQuarters(11).reverse(),
      datasets: [
        {
          data: divcounts["NSH"].reverse(),
          label: "NSH"
        },
        {
          data: divcounts["WTK"].reverse(),
          label: "WTK"
        },
        {
          data: divcounts["MMH"].reverse(),
          label: "MMH"
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Diversions per Quarter"
      },
      scales: {
        xAxes: [
          {
            stacked: true
          }
        ],
        yAxes: [
          {
            stacked: true
          }
        ]
      }
    }
  };
  return {
    psi:
      "https://quickchart.io/chart?encoding=base64&c=" +
      btoa(JSON.stringify(psiconfig).replace(/"([^(")"]+)":/g, "$1:")),
    ivt:
      "https://quickchart.io/chart?encoding=base64&c=" +
      btoa(JSON.stringify(ivtconfig).replace(/"([^(")"]+)":/g, "$1:")),
    div:
      "https://quickchart.io/chart?encoding=base64&c=" +
      btoa(JSON.stringify(divconfig).replace(/"([^(")"]+)":/g, "$1:"))
  };
}

module.exports = {
  weeklyReport,
  weeklyReportData,
  countIVT,
  countPSI,
  countDiversion,
  countMimic,
  countIntervention,
  countOvernight,
  countAll,
  mimicsKPI,
  interventionsKPI,
  ticiKPI,
  ivtsichKPI,
  getEvtPerWeek,
  getEvtPerQuarter,
  quarterCharts
};
