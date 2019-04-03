/*
Простейший регулятор
k - общий коэффициент усиления
tempUst - температура уставки
tau - коэффициент при дифф составляющей
border - минимум для изменения
*/
function SimpleRegulator(k, tempUst, tau, border) {
  this.k = k;
  this.tempUst = tempUst;
  this.tau = tau;
  this.border = border;

  // Прошлая разница температур
  this.prevDiff = 0;
  // Остаток при вычислениях меньше минимума выхода
  this.leftover = 0; 
}

// Вычисляет длину импульса
SimpleRegulator.prototype.calculate = function(current) {
  var diff = this.tempUst - current;
  var delta = this.prevDiff - diff;
  var res = 2.5 * this.k * (diff + this.tau * delta);
  if ((res > 0 && this.leftover < 0) || (res < 0 && this.leftover > 0)) {
    this.leftover = 0;
  }
  res = res + this.leftover;
  
  // Записываем новую разницу
  this.prevDiff = diff;
  this.leftover = 0;
  // При длине меньше границы - в остаток
  if (Math.abs(res) < this.border) {
    this.leftover = res;
    res = 0;
  }

  return res;
}

customLib.complex.SimpleRegulator = SimpleRegulator;