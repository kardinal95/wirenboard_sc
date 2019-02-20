var customlib = {};

customlib.any_on = function (switches) {
    return !switches.every(is_off);
}

customlib.all_off = function (switches) {
    return switches.every(is_off);
}

customlib.all_normal = function(detectors) {
    return detectors.every(is_normal);
}

customlib.as_ms = function (minutes) {
    return minutes * 60 * 1000;
}

// Only for OnOffSwitch
function is_off(sw) {
    return !sw.state;
}

// Only for detectors
function is_normal(det) {
    return det.normal;
}

global.customlib = customlib;
