// import {date} from 'quasar'
const { percent, median } = require("./stats");
const { getTimeframePatients } = require("./timeframePatients");
const {
  hasValidFields,
  isIntervention,
  isNotIntervention,
  isRepatriation,
  isMetro,
  isNonMetro
} = require("./filters");
const { kpiToHTML, timeToHTML } = require("./kpiFormatters");
const { differenceInMinutes } = require("date-fns");
const btoa = require("btoa");

function timeKPI(config) {
  if (
    config.patients === undefined ||
    config.timeframes === undefined ||
    config.threshold === undefined ||
    config.t1 === undefined ||
    config.t2 === undefined
  ) {
    console.error("TimeKPI: invalid config", config);
    return [];
  }
  if (config.htmlFormatter === undefined) {
    config.htmlFormatter = numerator => numerator.toString();
  }
  if (config.htmlTimeFormatter === undefined) {
    config.htmlTimeFormatter = median => median.toString();
  }
  var kpis = config.timeframes.map(curTimeframe => {
    // only keep patients with valid t1 and t2
    var patients = config.patients.filter(hasValidFields(config.t1, config.t2));

    // apply filters if exist
    if (config.filters) {
      config.filters.forEach(filterFn => {
        patients = patients.filter(filterFn);
      });
    }

    // only keep patients within the selected timeframe
    patients = getTimeframePatients(
      patients,
      curTimeframe.period,
      curTimeframe.steps
    );
    var timeDiffs = patients.map(patient => {
      var d1 = new Date(patient[config.t1]);
      var d2 = new Date(patient[config.t2]);
      // var td = date.getDateDiff(d2, d1, 'minutes')
      var td = differenceInMinutes(d2, d1);
      return td;
    });

    timeDiffs = timeDiffs.filter(td => {
      return td >= 0;
    });

    var denominator = timeDiffs.length;
    var numerator = timeDiffs.filter(td => td < config.threshold).length;

    var medianTimeDiff = median(timeDiffs);
    if (config.units === "hrs") {
      medianTimeDiff = Math.round(medianTimeDiff / 60);
    }

    return {
      metTarget: numerator,
      denominator: denominator,
      median: medianTimeDiff,
      prop: +(numerator / denominator).toFixed(4),
      percent: percent(numerator / denominator),
      percentn: Math.round((numerator / denominator) * 100),
      color: config.colorFn(numerator, denominator),
      html: config.htmlFormatter(numerator, denominator),
      htmlTime: config.htmlTimeFormatter(medianTimeDiff)
    };
  });
  return kpis;
}

function kpiTimeframes() {
  return [
    {
      period: "fiscalQuarters",
      steps: 0
    },
    {
      period: "fiscalQuarters",
      steps: -1
    },
    {
      period: "fiscalYears",
      steps: 0
    },
    {
      period: "fiscalYears",
      steps: -1
    }
  ];
}

function door2CT(patients) {
  return timeKPI({
    patients: patients.filter(
      pt =>
        pt.ArrivalType === "Code Stroke" &&
        (pt.PSI === true || pt.ThrombolysedACH === true)
    ),
    t1: "EDArrivalTime",
    t2: "CTTime",
    threshold: 25,
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 25, "<")
  });
}

function door2IVT(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "ThrombolysisTime",
    threshold: 60,
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 60, "<")
  });
}

function door2Groin(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "PSITime",
    threshold: 90,
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 90, "<")
  });
}

function door2GroinDirect(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "PSITime",
    threshold: 90,
    filters: [pt => pt.ArrivalType !== "PSI Transfer"],
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 90, "<")
  });
}

function door2GroinTransfer(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "PSITime",
    threshold: 40,
    filters: [pt => pt.ArrivalType === "PSI Transfer"],
    timeframes: kpiTimeframes(),
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 40, "<")
  });
}

function door2Repatriation(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "WardDischargeTime",
    threshold: 60 * 24,
    units: "hrs",
    timeframes: kpiTimeframes(),
    filters: [isRepatriation],
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 24 * 60, "<")
  });
}

function door2RepatriationI(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "WardDischargeTime",
    threshold: 60 * 24,
    units: "hrs",
    timeframes: kpiTimeframes(),
    filters: [isRepatriation, isIntervention],
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 24 * 60, "<")
  });
}

function door2RepatriationIM(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "WardDischargeTime",
    threshold: 60 * 24,
    units: "hrs",
    timeframes: kpiTimeframes(),
    filters: [isRepatriation, isIntervention, isMetro],
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 24 * 60, "<")
  });
}

function door2RepatriationIR(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "WardDischargeTime",
    threshold: 60 * 24,
    units: "hrs",
    timeframes: kpiTimeframes(),
    filters: [isRepatriation, isIntervention, isNonMetro],
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 24 * 60, "<")
  });
}

function door2RepatriationNoI(patients) {
  return timeKPI({
    patients: patients,
    t1: "EDArrivalTime",
    t2: "WardDischargeTime",
    threshold: 60 * 6,
    units: "hrs",
    timeframes: kpiTimeframes(),
    filters: [isRepatriation, isNotIntervention],
    colorFn: (numerator, denominator) =>
      kpiToColor(numerator, denominator, 0.8, ">"),
    htmlFormatter: (numerator, denominator) =>
      kpiToHTML(numerator, denominator, 0.8, ">"),
    htmlTimeFormatter: time => timeToHTML(time, 6 * 60, "<")
  });
}

function kpiGauge(percent, target, title) {
  var color;
  if (percent >= target) color = "green";
  else if (percent > target * 0.75) color = "orange";
  else color = "red";

  let config = {
    type: "radialGauge",
    data: {
      datasets: [{ data: [percent], backgroundColor: color }]
    },
    options: {
      title: {
        display: false,
        text: title,
        fontSize: 20,
        padding: 30
      },
      centerPercentage: 60,
      roundedCorners: false,
      centerArea: {
        text: percent + "%"
      }
    }
  };
  return (
    "https://quickchart.io/chart?h=200&w=332&encoding=base64&c=" +
    btoa(JSON.stringify(config).replace(/"([^(")"]+)":/g, "$1:"))
  );
}

function quarterReport(patients) {
  return {
    door2ct: kpiGauge(door2CT(patients)[1].percentn, 80, "Door2CT < 25min"),
    door2ivt: kpiGauge(
      door2IVT(patients)[1].percentn,
      80,
      "Door2Needle < 60min"
    ),
    door2groin: kpiGauge(
      door2Groin(patients)[1].percentn,
      80,
      "Door2Groin < 90min"
    )
  };
}

module.exports = {
  kpiTimeframes,
  door2CT,
  door2Groin,
  door2GroinDirect,
  door2GroinTransfer,
  door2IVT,
  door2Repatriation,
  door2RepatriationI,
  door2RepatriationNoI,
  door2RepatriationIR,
  door2RepatriationIM,
  quarterReport
};
