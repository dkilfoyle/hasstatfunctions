exports.hasValidFields = function(field1, field2) {
  return function(pt) {
    return pt[field1] !== null && pt[field2] !== null;
  };
};

exports.isAny = function() {
  return true;
};

function isDHB(dhb) {
  return function(pt) {
    var hospitals = [];
    if (dhb === "ADHB") hospitals = ["Auckland"];
    if (dhb === "WDHB") hospitals = ["Northshore", "Waitakere"];
    if (dhb === "CMDHB") hospitals = ["Middlemore"];
    if (dhb === "NonMetro") {
      hospitals = [
        "Whangarei",
        "Waikato",
        "Rotorua",
        "Tauranga",
        "Taupo",
        "Gisborne",
        "Taranaki",
        "Other"
      ];
    }

    if (dhb === "Metro") {
      hospitals = ["Auckland", "Northshore", "Waitakere", "Middlemore"];
    }
    if (dhb === "Any") {
      hospitals = [
        "Auckland",
        "Northshore",
        "Waitakere",
        "Middlemore",
        "Whangarei",
        "Waikato",
        "Rotorua",
        "Tauranga",
        "Taupo",
        "Gisborne",
        "Taranaki",
        "Other"
      ];
    }
    return pt.OriginHospital && hospitals.includes(pt.OriginHospital);
  };
}

exports.isDHB = isDHB;

exports.isHospital = function(dhb) {
  return function(pt) {
    var hospitals = [];
    if (dhb === "ACH") hospitals = ["Auckland"];
    if (dhb === "WTK") hospitals = ["Waitakere"];
    if (dhb === "NSH") hospitals = ["Northshore"];
    if (dhb === "MMH") hospitals = ["Middlemore"];
    if (dhb === "Diversion")
      hospitals = ["Waitakere", "Northshore", "Middlemore"];
    if (dhb === "Any") {
      hospitals = [
        "Auckland",
        "Northshore",
        "Waitakere",
        "Middlemore",
        "Whangarei",
        "Waikato",
        "Rotorua",
        "Tauranga",
        "Taupo",
        "Gisborne",
        "Taranaki",
        "Other"
      ];
    }

    return pt.OriginHospital && hospitals.includes(pt.OriginHospital);
  };
};

exports.isMetro = function(pt) {
  return isDHB("Metro")(pt);
};

exports.isNonMetro = function(pt) {
  return isDHB("NonMetro")(pt);
};

exports.isMimic = function(pt) {
  return pt.Diagnosis === "Mimic";
};

exports.isIntervention = function(pt) {
  return pt.ThrombolysedACH || pt.PSI;
};

exports.isNotIntervention = function(pt) {
  return !(pt.ThrombolysedACH || pt.PSI);
};

exports.isDiversion = function(pt) {
  return pt.ArrivalType === "Diversion";
};

exports.isRepatriation = function(pt) {
  return ["PSI Transfer", "Diversion"].includes(pt.ArrivalType);
};

exports.isTICI2B3 = function(pt) {
  return ["2B", "3"].includes(pt.PSIResult);
};
