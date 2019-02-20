var lights = [
    vdevs["lights"]["bath_main"],
    vdevs["lights"]["bath_hall"]
];

defineRule("RestartFanCycleMorning", {
    when: cron("0 6 * * *"),
    then: function() {
        startTimer("fan_rest", 30000);
        log("[Fan] Cron restarted...");
    }
});

defineRule("FanEnableOnBathLight", {
    asSoonAs: function () {
        return customlib.any_on(lights);
    },
    then: function ()  {
        log("[Fan] Lights on!");
        timers.fan_bath.stop()
        vdevs["switches"]["fan"].enable();
    }
  });

defineRule("FanDisableOnBathLightOff", {
    asSoonAs: function () {
        return customlib.all_off(lights);
    },
    then: function ()  {
        log("[Fan] Lights off!");
        startTimer("fan_bath", customlib.as_ms(storage.values["fan_bath"]));
    }
  });

defineRule("TimerFixOnFanEnable", {
    asSoonAs: function () {
        return vdevs["switches"]["fan"].state;
    },
    then: function ()  {
        timers.fan_rest.stop()
    }
  });

defineRule("FanActiveTimerEnd", {
    asSoonAs: function () {
        return timers.fan_active.firing;
    },
    then: function ()  {
        log("[Fan] Active timer stop!");
        if (timers.fan_bath.firing || customlib.any_on(lights)) {
            return;
        }
        log("[Fan] Disabling fan...");
        startTimer("fan_rest", customlib.as_ms(storage.values["fan_rest"]));
        vdevs["switches"]["fan"].disable();
    }
  });

defineRule("FanRestTimerEnd", {
    asSoonAs: function () {
        return timers.fan_rest.firing;
    },
    then: function ()  {
        var date = Date();
        if (date.getHours() > storage.values["fan_block_start"] 
        || date.getHours() < storage.values["fan_block_end"])
        {
            return;
        }
        log("[Fan] Rest timer stop! Enabling fan...");
        startTimer("fan_active", customlib.as_ms(storage.values["fan_active"]));
        vdevs["switches"]["fan"].enable();
    }
  });

defineRule("FanBathTimerEnd", {
    asSoonAs: function () {
        return timers.fan_bath.firing;
    },
    then: function ()  {
        log("[Fan] Bath timer stop!");
        if (timers.fan_active.firing) {
            return;
        }
        log("[Fan] Disabling fan...");
        startTimer("fan_rest", customlib.as_ms(storage.values["fan_rest"]));
        vdevs["switches"]["fan"].disable();
    }
  });