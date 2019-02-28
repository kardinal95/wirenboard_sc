var sensors = [
  vdevs.sensors.ch4,
  vdevs.sensors.co_100
];

// Обеспечение безопасности на ГГК
defineRule("GasSafetyDisabler", {
  whenChanged: function () {
    return customLib.allNormal(sensors);
  },
  then: function (newValue, devName, cellName) {
    if (newValue == true) {
      log.info("[GAS] Safety OK. Enabling GGK...");
      vdevs.switches.ggk.enable();
    } else {
      log.warning("[GAS] Safety ALERT. Disabling GGK...");
      vdevs.switches.ggk.disable();
    }
  }
});

// Контроль переключение вентиля по температуре ГВС
defineRule("ValveControlOnHws", {
  whenChanged: function () {
    return vdevs.sensors.t3.value;
  },
  then: function (newValue, devName, cellName) {
    if (!vdevs.sensors.t3.trusted) {
      log.error("[HEAT] Incorrect values on T3!");
      return;
    }
    if (newValue < constants.temp.HWS_TARGET - constants.temp.HWS_LOW_HYST) {
      vdevs.complex.heatValve.switchMode('hws');
    } else if (newValue > constants.temp.HWS_TARGET) {
      vdevs.complex.heatValve.switchMode('heat');
    }
  }
});