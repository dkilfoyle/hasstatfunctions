exports.hasValidFields = function (field1, field2) {
  return function (pt) {
    return pt[field1] !== null && pt[field2] !== null;
  };
};

exports.isAny = function () {
  return true;
};

function isDHB(dhb) {
  return function (pt) {
    var hospitals = [];
    switch (dhb) {
      case "Any": hospitals = [
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
      ]; break;
      case "ADHB": hospitals = ["Auckland"]; break;
      case "WDHB": hospitals = ["Northshore", "Waitakere"]; break;
      case "CMDHB": hospitals = ["Middlemore"]; break;
      case "Metro": hospitals = ["Auckland", "Northshore", "Waitakere", "Middlemore"]; break;
      case "Northland": hospitals = ["Whangarei"]; break;
      case "Waikato": hospitals = ["Waikato"]; break;
      case "Lakes": hospitals = ["Rotorua", "Taupo"]; break;
      case "BOP": hospitals = ["Tauranga"]; break;
      case "Tairawhiti": hospitals = ["Gisborne"]; break;
      case "Taranaki": hospitals = ["Taranaki"]; break;
      case "NonMetro": hospitals = [
        "Whangarei",
        "Waikato",
        "Rotorua",
        "Tauranga",
        "Taupo",
        "Gisborne",
        "Taranaki",
        "Other"
      ];
      default: hospitals = ["Other"]
    }
    return pt.OriginHospital && hospitals.includes(pt.OriginHospital);
  };
}

exports.isDHB = isDHB;

exports.isHospital = function (dhb) {
  return function (pt) {
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

exports.isMetro = function (pt) {
  return isDHB("Metro")(pt);
};

exports.isNonMetro = function (pt) {
  return isDHB("NonMetro")(pt);
};

exports.isMimic = function (pt) {
  return pt.Diagnosis === "Mimic";
};

exports.isIntervention = function (pt) {
  return pt.ThrombolysedACH || pt.PSI;
};

exports.isNotIntervention = function (pt) {
  return !(pt.ThrombolysedACH || pt.PSI);
};

exports.isDiversion = function (pt) {
  return pt.ArrivalType === "Diversion";
};

exports.isRepatriation = function (pt) {
  return ["PSI Transfer", "Diversion"].includes(pt.ArrivalType);
};

exports.isTICI2B3 = function (pt) {
  return ["2B", "3"].includes(pt.PSIResult);
};
