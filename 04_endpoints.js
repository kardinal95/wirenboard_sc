// Общий класс конечного устройства
// target - строка подключения устройства
// Обьекты данного класса не используются отдельно, только для наследования
function Endpoint(target) {
  this.target = target;
  // Значение полученное с устройства
  Object.defineProperty(this, '_value', {
    get: function () {
      return dev[this.target];
    },
    set: function (value) {
      dev[this.target] = value;
    }
  });
}

// Переключатель On/Off
function OnOffSwitch(target) {
  // Наследуем
  Endpoint.call(this, target);
  // Включение только если был выключен
  this.enable = function () {
    if (this._value != true) {
      this._value = true;
    }
  }
  // Выключение только если был включен
  this.disable = function () {
    if (this._value != false) {
      this._value = false;
    }
  }
  Object.defineProperty(this, 'value', {
    get: function () {
      return this._value;
    }
  });
}

// Переключатель включаемый на время
// Стандартное состояние - выключен
function TimedOnSwitch(target, timeout) {
  // Наследуем обычный выключатель
  OnOffSwitch.call(this, target);
  // Таймаут по умолчанию
  this._timeout = timeout;
  // Текущий таймер
  this._timer = null;

  // Переопределяем стандартное включение
  var defEnable = this.enable;
  this.enable = function (tout) {
    // Выбираем по наличию: стандартное (общее) время
    // Либо переданное в функцию
    if (tout == undefined || tout == null) {
      if (this._timeout == undefined || this._timeout == null) {
        tout = constants.system.DEFAULT_TIMED_SWITCH_ON;
      } else {
        tout = this._timeout;
      }
    }
    //　Стандартное включение
    defEnable.call(this);
    // Заводим таймер если не заведен
    if (this._timer == null) {
      this._timer = setTimeout(this.disable.bind(this), tout * 1000);
    }
  }

  // Переопределяем стандартное выключение
  var defDisable = this.disable;
  this.disable = function () {
    // Стандартное выключение
    defDisable.call(this);
    // Если таймер работает - обнуляем
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}

// Датчик с "дефолтным" состоянием
// Выдает alarm если текущее состояние отличается от "дефолтного"
function AlarmSensor(target, def) {
  // Наследуем
  Endpoint.call(this, target);
  this._def = def;
  Object.defineProperty(this, 'alarm', {
    get: function () {
      return this._value != this._def;
    }
  });
}

// Датчик выдающий числовое значение
// Поддерживает определение максимальной/минимальной границы
// А также стандартное значение на случай недостоверных показаний
function ValueSensor(target, max, min, def) {
  // Наследуем
  Endpoint.call(this, target);
  this._max = max;
  this._min = min;
  this._def = def;
  Object.defineProperty(this, 'trusted', {
    get: function () {
      // Считаем недостоверным если значение отсутствует
      if (this._value == undefined || this._value == null) {
        return false;
      }
      // Если определен максимум и значение выше
      if (this._max != null && this._value > this._max) {
        return false;
      }
      // Если определен минимум и значение меньше
      if (this._min != null && this._value < this._min) {
        return false;
      }
      return true;
    }
  });
  Object.defineProperty(this, 'value', {
    get: function () {
      // Выдаем значение если показания достоверны
      if (this.trusted) {
        return this._value;
      }
      // В противном случае возвращаем значение по умолчанию
      return this._def;
    }
  });
}

// Кастомные устройства с сложным типом управления
// Вентиль отопления
var heatValve = {
  // Включение ГВС
  hwsSw: new TimedOnSwitch("wb-gpio/EXT6_R3A1", 30),
  // Включение отопления
  heatSw: new TimedOnSwitch("wb-gpio/EXT6_R3A2", 30),
  // Текущий режим
  mode: null,
  switchMode: function (mode) {
    // Переключаемся только если действительно есть изменение режима работы
    if (this.mode == mode) {
      return;
    }
    this.mode = mode;
    // Выключаем оба переключателя ОБЯЗАТЕЛЬНО!
    this.hwsSw.disable();
    this.heatSw.disable();
    // Включаем нужный
    if (this.mode == 'hws') {
      log.info('[DEV] HeatingValve - Switching to HWS...')
      // TODO Make a separate type for this
      dev["wb-dac/MOD1_O1"] = constants.temp.HWS_TARGET * 100 + 2000;
      this.hwsSw.enable();
      vdevs.complex.testReg.disable();
    } else if (this.mode == 'heat') {
      log.info('[DEV] HeatingValve - Switching to heating...')
      // TODO Make a separate type for this
      dev["wb-dac/MOD1_O1"] = constants.system.LOW_DAC_V;
      this.heatSw.enable();
      vdevs.complex.testReg.enable();
    } else {
      log.error('[DEV] HeatingValve - Incorrect mode');
    }
  }
}

var testTempReg = {
  //K, уставка, тау, мин.длит.импульса
  reg: new customLib.complex.SimpleRegulator(constants.system.TP_REG_K,
    constants.temp.TP_TARGET,
    constants.system.TP_REG_TAU,
    constants.system.TP_REG_BORDER_MS),
  // ТП больше
  tpMore: new TimedOnSwitch("wb-gpio/EXT6_R3A3", 0),
  // ТП меньше
  tpLess: new TimedOnSwitch("wb-gpio/EXT6_R3A4", 0),
  enabled: null,
  run: function() {
    // TODO Change on working to sensor
    temp = dev['wb-w1/28-02099177d5e8'];
    out = this.reg.calculate(temp);
    // TODO Delete on working
    log.info('[TR] ' + 'Curr: ' + temp + ', Out: ' + out + 'ms, Lo: ' + this.reg.leftover + 'ms');
    if (out == 0) {
      return;
    } else {
      this.tpLess.disable();
      this.tpMore.disable();
    }
    if (out < 0) {
      this.tpLess.enable(Math.abs(out) / 1000);
    }
    if (out > 0) {
      this.tpMore.enable(out / 1000);
    }
  },
  enable: function() {
    if (this.enabled == null) {
      this.enabled = setInterval(this.run.bind(this), 6*1000);
    }
  },
  disable: function() {
    if (this.enabled != null) {
      clearInterval(this.enabled);
      this.enabled = null;
    }
  }
}

var vdevs = {
  // Переключатели света
  lights: {
    // Ванная - спальня
    bathMain: new OnOffSwitch("wb-mr6c_53/K2"),
    // Ванная в холле 2 этаж
    bathHall: new OnOffSwitch("wb-mr6c_53/K1")
  },
  // Переключатели
  switches: {
    // Вентиляция
    vent: new OnOffSwitch("wb-gpio/EXT5_R3A5"),
    // Главный газовый клапан
    ggk: new OnOffSwitch("wb-gpio/EXT5_R3A6")
  },
  sensors: {
    // Датчик СН4
    ch4: new AlarmSensor("wb-gpio/EXT2_DR14", true),
    // Датчик СО (II)
    co_100: new AlarmSensor("wb-gpio/EXT2_DR13", true),
    // Датчик температуры ГВС
    t3: new ValueSensor("wb-w1/28-01183062d0ff", 100, 0, null)
  },
  // Сложные устройства
  complex: {
    // Вентиль отопления
    heatValve: heatValve,
    testReg: testTempReg
  }
};

global.vdevs = vdevs;