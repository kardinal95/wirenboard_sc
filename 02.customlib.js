var customLib = {
  // Любой из переключателей включен
  anyOn: function (switches) {
    return !switches.every(isOff);
  },
  // Все переключатели выключены
  allOff: function (switches) {
    return switches.every(isOff);
  },
  // Все датчики в нормальном состоянии (не аларм)
  allNormal: function (sensors) {
    return sensors.every(isNormal);
  },
  // Перевод минут в мс
  asMs: function (minutes) {
    return minutes * 60 * 1000;
  }
};

// Работает только с классом OnOffSwitch
function isOff(sw) {
  return !sw.value;
}

// Работает только с классом AlarmSensor
function isNormal(sensor) {
  return !sensor.alarm;
}

global.customLib = customLib;
