var constants = {
  // Температуры (градусы цельсия)
  temp: {
    // Температура поддерживаемая для ГВС
    HWS_TARGET: 45,
    // Гистерезис ГВС (нижний)
    HWS_LOW_HYST: 4
  },
  // Временные интервалы (минуты)
  timers: {
    // Максимальное время вентиляции в состоянии "отдыха"
    VENT_REST: 45,
    // Время проветривания в обычном режиме
    VENT_ACTIVE: 15,
    // Время проветривания после отключения света в ванных комнатах
    VENT_BATH: 10
  },
  // Временные границы (в зависимости от постфикса)
  timeBorders: {
    // Время начала блокировки вентиляции (часы)
    VENT_TOUT_START_H: 22,
    // Время конца блокировки (часы)
    VENT_TOUT_END_H: 6
  },
  // Системные переменные
  system: {
    // Стандартное время включения переключателя с таймером
    DEFAULT_TIMED_SWITCH_ON: 10
  }
};

global.constants = constants;