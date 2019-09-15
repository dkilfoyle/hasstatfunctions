const {
  getPriorCalendarYears,
  getPriorFiscalYears,
  getPriorFiscalQuarters,
  getPriorMonths,
  getFiscalYear,
  getFiscalQuarter,
  getMonthYearName
} = require("./getPriorDates");

// const subWeeks = require("date-fns/subWeeks");
// const isWithinInterval = require("date-fns/isWithinInterval");
const { subWeeks, isWithinInterval, getDayOfYear } = require("date-fns");

function getBackCalendarYearPatients(patients, timeStep) {
  // timestep = 0 = current year only
  // timestep < 0 = single year n ago
  // timestep > 0 = back n years
  var years = getPriorCalendarYears(timeStep);
  return patients.filter(patient => {
    var ed = new Date(patient.EDArrivalTime);
    return ed && years.includes(ed.getFullYear());
  });
}

function getBackCalendarYTDPatients(patients, timeStep) {
  // timestep = 0 = current year only
  // timestep < 0 = single year n ago
  // timestep > 0 = back n years
  var years = getPriorCalendarYears(timeStep);
  var doy = getDayOfYear(Date.now());
  return patients.filter(patient => {
    var ed = new Date(patient.EDArrivalTime);
    return ed && years.includes(ed.getFullYear()) && getDayOfYear(ed) <= doy;
  });
}

function getBackFiscalYearPatients(patients, timeStep) {
  var years = getPriorFiscalYears(timeStep);
  return patients.filter(patient => {
    var ed = new Date(patient.EDArrivalTime);
    return ed && years.includes(getFiscalYear(ed));
  });
}

function getBackFiscalQuarterPatients(patients, timeStep) {
  var quarters = getPriorFiscalQuarters(timeStep);
  return patients.filter(patient => {
    var ed = new Date(patient.EDArrivalTime);
    return ed && quarters.includes(getFiscalQuarter(ed));
  });
}

function getBackMonthPatients(patients, timeStep) {
  // timestep = 0 = current quarter only
  // timestep < 0 = single quarter n ago
  // timestep > 0 = back n quarters
  var months = getPriorMonths(timeStep);
  return patients.filter(patient => {
    var ed = new Date(patient.EDArrivalTime);
    return ed && months.includes(getMonthYearName(ed));
  });
}

function getBackWeekPatients(patients, timeStep) {
  var today = new Date();
  var startDate = subWeeks(today, Math.abs(timeStep));

  return patients.filter(pt =>
    isWithinInterval(pt.EDArrivalTime, {
      start: subWeeks(startDate, 1),
      end: startDate
    })
  );
}

function getTimeframeName(timeFrame) {
  var name = "";
  switch (timeFrame.period) {
    case "fiscalQuarters":
      name = getPriorFiscalQuarters(timeFrame.steps);
  }
  return name[0];
}

function getTimeframePatients(patients, timeFrame, timeStep) {
  switch (timeFrame) {
    case "calendarYTD":
      patients = getBackCalendarYTDPatients(patients, timeStep);
      break;
    case "calendarYears":
      patients = getBackCalendarYearPatients(patients, timeStep);
      break;
    case "fiscalYears":
      patients = getBackFiscalYearPatients(patients, timeStep);
      break;
    case "fiscalQuarters":
      patients = getBackFiscalQuarterPatients(patients, timeStep);
      break;
    case "months":
      patients = getBackMonthPatients(patients, timeStep);
      break;
    case "weeks":
      patients = getBackWeekPatients(patients, timeStep);
      break;
  }
  return patients;
}

module.exports = {
  getTimeframePatients,
  getTimeframeName,
  getBackWeekPatients,
  getBackMonthPatients,
  getBackFiscalQuarterPatients,
  getBackFiscalYearPatients,
  getBackCalendarYTDPatients,
  getBackCalendarYearPatients
};
