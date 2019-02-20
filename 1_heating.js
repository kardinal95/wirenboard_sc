var detectors = [
    vdevs["detectors"]["CH4"],
    vdevs["detectors"]["CO_100"]
];

var modeHWS = true;

function switchHWS(state) {
    log("[HEAT] Trying to switch mode to " + state);
    if (modeHWS == state) {
        log("[HEAT] Already in required mode. Quitting...");
        return;
    }
    modeHWS = state;
    log("[HEAT] Mode switched!");
    vdevs["switches"]["Valve_HWS"].disable();
    vdevs["switches"]["Valve_Heating"].disable();
    if (state == true) {
        log("[HEAT] Enabling HWS Valve");
        vdevs["switches"]["Valve_HWS"].enable();
    } else {
        log("[HEAT] Enabling Heating Valve");
        vdevs["switches"]["Valve_Heating"].enable();
    }
}

// Main gas valve safety
defineRule("GasSafetyDisabler", {
    whenChanged: function() {
        return customlib.all_normal(detectors);
    },
    then: function(newValue, devName, cellName) {
        if (newValue == true) {
            log("[GAS] Safety OK. Enabling GGK...");
            vdevs["switches"]["GGK"].enable();
        }
        else {
            log("[GAS] Safety ALERT. Disabling GGK...");
            vdevs["switches"]["GGK"].disable();
        }
    }
});

defineRule("HWSControlOnTemp", {
    whenChanged: function() {
        return vdevs["detectors"]["T3"].value;
    },
    then: function(newValue, devName, cellName) {
        if (vdevs["detectors"]["T3"].failed) {
            log("[HEAT] Incorrect values on T3!");
            return;
        }
        if (newValue < storage.values["hws_target"] - storage.values["hws_hyst"]) {
            switchHWS(true);
        } else if (newValue > storage.values["hws_target"]) {
            switchHWS(false);
        }
    }
});