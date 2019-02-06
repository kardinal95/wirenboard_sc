var lights = [
    endpoints["bathroom_main_light_sw"],
    endpoints["bathroom_hall_light_sw"]
];

defineRule("RestartCoolingCycleMorning", {
    when: cron("0 1 * * *"),
    then: function() {
        startTimer("cooler_rest", 30000);
    }
});

defineRule("CoolerEnableOnBathroomLight", {
    asSoonAs: function () {
        return customlib.any_true(lights);
    },
    then: function ()  {
        log("[Cooler] Lights on!");
        timers.cooler_bathroom.stop()
        endpoints["home_cooler_sw"].set(true);
    }
  });

defineRule("CoolerDisableOnBathroomLightOff", {
    asSoonAs: function () {
        return customlib.all_false(lights);
    },
    then: function ()  {
        log("[Cooler] Lights off!");
        startTimer("cooler_bathroom", customlib.as_ms(storage.values["cooler_bathroom"]));
    }
  });

defineRule("TimerFixOnCoolerEnable", {
    asSoonAs: function () {
        return endpoints["home_cooler_sw"].enabled();
    },
    then: function ()  {
        timers.cooler_rest.stop()
    }
  });

defineRule("CoolerActiveTimerEnd", {
    asSoonAs: function () {
        return timers.cooler_active.firing;
    },
    then: function ()  {
        log("[Cooler] Active timer stop!");
        if (timers.cooler_bathroom.firing || customlib.any_true(lights)) {
            return;
        }
        log("[Cooler] Disabling cooler...");
        startTimer("cooler_rest", customlib.as_ms(storage.values["cooler_rest"]));
        endpoints["home_cooler_sw"].set(false);
    }
  });

defineRule("CoolerRestTimerEnd", {
    asSoonAs: function () {
        return timers.cooler_rest.firing;
    },
    then: function ()  {
        var date = Date();
        if (date.getHours() > storage.values.cooler_block_start 
        || date.getHours() < storage.values.cooler_block_end)
        {
            return;
        }
        log("[Cooler] Rest timer stop! Enabling cooler...");
        startTimer("cooler_active", customlib.as_ms(storage.values["cooler_active"]));
        endpoints["home_cooler_sw"].set(true);
    }
  });

defineRule("CoolerBathroomTimerEnd", {
    asSoonAs: function () {
        return timers.cooler_bathroom.firing;
    },
    then: function ()  {
        log("[Cooler] Bathroom timer stop!");
        if (timers.cooler_active.firing) {
            return;
        }
        log("[Cooler] Disabling cooler...");
        startTimer("cooler_rest", customlib.as_ms(storage.values["cooler_rest"]));
        endpoints["home_cooler_sw"].set(false);
    }
  });