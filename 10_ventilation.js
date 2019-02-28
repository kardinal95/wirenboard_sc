var lights = [
  vdevs.lights.bathMain,
  vdevs.lights.bathHall
];

// Рестарт цикла вентиляции каждое утро в 6 часов
defineRule("RestartVentCycleMorning", {
  when: cron("0 0 6 * * *"),
  then: function () {
    startTimer("fanRest", 30000);
    log.info("[Vent] Cron restarted...");
  }
});

// Включение вентиляции при включении света в санузле
defineRule("VentEnableOnBathLight", {
  asSoonAs: function () {
    return customLib.anyOn(lights);
  },
  then: function () {
    log("[Vent] Bath lights enabled!");
    timers.ventBath.stop();
    vdevs.switches.vent.enable();
  }
});

// Выключение вентиляции после выключение света в санузле по таймауту
defineRule("VentDisableOnBathLightOff", {
  asSoonAs: function () {
    return customLib.allOff(lights);
  },
  then: function () {
    log("[Vent] Bath lights disabled!");
    startTimer("ventBath", customLib.asMs(constants.timers.VENT_BATH));
  }
});

// Выключение таймера простоя при включении вентиляции
defineRule("TimerFixOnVentEnable", {
  asSoonAs: function () {
    return vdevs.switches.vent.value;
  },
  then: function () {
    timers.ventRest.stop();
  }
});

// Выключение вентиляции и включение таймера простоя
// при выключении проветривания по таймеру
defineRule("VentActiveTimerEnd", {
  asSoonAs: function () {
    return timers.ventActive.firing;
  },
  then: function () {
    log("[Vent] Active timer stop!");
    // Не выключаем если выключим через освещение ванной
    if (timers.ventBath.firing || customLib.anyOn(lights)) {
      return;
    }
    log("[Vent] Disabling vent...");
    startTimer("ventRest", customLib.asMs(constants.timers.VENT_REST));
    vdevs.switches.vent.disable();
  }
});

// Включение вентиляции и включение таймера активности
// по окончанию простоя
defineRule("VentRestTimerEnd", {
  asSoonAs: function () {
    return timers.ventRest.firing;
  },
  then: function () {
    // Ночью простой не включает вентиляцию
    var date = new Date();
    if (date.getHours() > constants.timeBorders.VENT_TOUT_START_H ||
      date.getHours() < constants.timeBorders.VENT_TOUT_END_H) {
      return;
    }
    log("[Vent] Rest timer stop! Enabling vent...");
    startTimer("ventActive", customLib.asMs(constants.timers.VENT_ACTIVE));
    vdevs.switches.vent.enable();
  }
});

// Выключение вентиляции по окончанию таймера ванной
defineRule("VentBathTimerEnd", {
  asSoonAs: function () {
    return timers.ventBath.firing;
  },
  then: function () {
    log("[Vent] Bath timer stop!");
    // Не выключаем если не закончено проветривание по таймеру
    if (timers.ventActive.firing) {
      return;
    }
    log("[Vent] Disabling vent...");
    startTimer("ventRest", customLib.asMs(constants.timers.VENT_REST));
    vdevs.switches.vent.disable();
  }
});