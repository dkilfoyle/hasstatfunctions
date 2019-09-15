// import {date} from 'quasar'
// import { subMonths } from "date-fns";
var { subMonths } = require("date-fns");
var { subYears } = require("date-fns");

function getFiscalQuarter(testDate) {
  return getFiscalYear(testDate) + "-" + getFiscalQuarterN(testDate);
}

function getFiscalQuarterN(testDate) {
  var q = [3, 4, 1, 2];
  return q[Math.floor(testDate.getMonth() / 3)];
}

function getFiscalYear(testDate) {
  if (testDate.getMonth() > 5) {
    return (
      testDate
        .getFullYear()
        .toString()
        .slice(2) + (testDate.getFullYear() + 1).toString().slice(2)
    );
  } else {
    return (
      (testDate.getFullYear() - 1).toString().slice(2) +
      testDate
        .getFullYear()
        .toString()
        .slice(2)
    );
  }
}

function getPriorMonthName(numMonths) {
  var now = new Date();
  var x = new Date(now.getFullYear(), now.getMonth() - numMonths, 1);
  return x.toLocaleString("en-nz", {
    month: "long"
  });
}

function getMonthYearName(testDate) {
  return (
    (testDate.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    testDate.getFullYear()
  );
}

function getPriorFiscalQuarters(timeStep) {
  // timestep = 0 = current quarter only
  // timestep < 0 = single quarter n ago
  // timestep > 0 = back n quarters
  var today = new Date();
  var quarters = [];

  if (timeStep < 0) {
    quarters.push(
      getFiscalQuarter(
        subMonths(today, Math.abs(timeStep) * 3)
        // date.subtractFromDate(today, {
        //   month: Math.abs(timeStep) * 3
        // })
      )
    );
  } else {
    for (var i = 0; i < timeStep + 1; i++) {
      quarters.push(
        getFiscalQuarter(
          subMonths(today, i * 3)
          // date.subtractFromDate(today, {
          //   month: i * 3
          // })
        )
      );
    }
  }
  return quarters;
}

function getPriorFiscalYears(timeStep) {
  // timestep = 0 = current year only
  // timestep < 0 = single year n ago
  // timestep > 0 = back n years
  var today = new Date();
  var years = [];

  if (timeStep < 0) {
    years.push(
      getFiscalYear(
        subYears(today, Math.abs(timeStep))
        // date.subtractFromDate(today, {
        //   year: Math.abs(timeStep)
        // })
      )
    );
  } else {
    for (var i = 0; i < timeStep + 1; i++) {
      years.push(
        getFiscalYear(
          subYears(today, i)
          // date.subtractFromDate(today, {
          //   year: i
          // })
        )
      );
    }
  }
  return years;
}

function getPriorCalendarYears(timeStep) {
  var today = new Date();
  var curYear = today.getFullYear();
  var years = [];
  if (timeStep < 0) {
    years.push(curYear + timeStep);
  } else {
    for (var i = 0; i < timeStep + 1; i++) {
      years.push(curYear - i);
    }
  }
  return years;
}

function getPriorMonths(timeStep) {
  var months = [];
  var testDate;
  if (timeStep < 0) {
    // testDate = date.subtractFromDate(new Date(), {
    //   month: Math.abs(timeStep)
    // })
    testDate = subMonths(new Date(), Math.abs(timeStep));
    months.push(getMonthYearName(testDate)); // getMonth is 0 based
  } else {
    for (var i = 0; i < timeStep + 1; i++) {
      // testDate = date.subtractFromDate(new Date(), {
      //   month: i
      // })
      testDate = subMonths(new Date(), i);
      months.push(getMonthYearName(testDate));
    }
  }
  return months;
}

module.exports = {
  getPriorMonthName,
  getMonthYearName,
  getPriorFiscalYears,
  getPriorFiscalQuarters,
  getPriorCalendarYears,
  getPriorMonths,
  getFiscalYear,
  getFiscalQuarter
};
