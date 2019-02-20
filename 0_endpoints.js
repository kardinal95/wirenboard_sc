function Endpoint (target) {
    this.target = target;
    Object.defineProperty(this, 'value', {
        get: function () { return dev[this.target]; },
        set: function (value) { dev[this.target] = value; }
    });
}

function OnOffSwitch(target) {
    this.Endpoint = new Endpoint(target);
    Object.defineProperty(this, 'state', {
        get: function () { return this.Endpoint.value; },
        set: function (value) {
            if (this.Endpoint.value == value) {
                return; // No switching on same!
            }
            this.Endpoint.value = value; 
        }
    });
    this.enable = function() {
        this.state = true;
    }
    this.disable = function() {
        this.state = false;
    }
}

// Timeout in seconds
function TimedOnSwitch(target, timeout) {
    this.Endpoint = new Endpoint(target);
    this.timer = null;
    Object.defineProperty(this, 'state', {
        get: function () { return this.Endpoint.value; },
        set: function (value) {
            if (this.Endpoint.value == value) {
                return; // No switching on same!
            }
            this.Endpoint.value = value; 
        }
    });
    this.disable = function() {
        this.state = false;
        if (this.timer != null) {
            log("[DEV] Clearing timer on timed switch...");
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    this.enable = function() {
        this.state = true;
        if (this.timer == null) {
            log("[DEV] Setting timer on timed switch...");
            this.timer = setTimeout(this.disable.bind(this), timeout * 1000);
        }
    }
}

function BinaryDetector(target, def) {
    this.Endpoint = new Endpoint(target);
    this.def = def;
    Object.defineProperty(this, 'normal', {
        get: function() { return this.Endpoint.value == def; },
    });
}

function ValueDetector(target, max_value, min_value, def) {
    this.Endpoint = new Endpoint(target);
    this.max_vaue = max_value;
    this.min_value = min_value;
    this.def = def;
    Object.defineProperty(this, 'trueValue', {
        get: function () { return this.Endpoint.value; }
    });
    Object.defineProperty(this, 'failed', {
        get: function () {
            if (this.trueValue == undefined || this.trueValue == null) {
                return true;
            }
            if (this.max_value != null && this.trueValue > max_value) {
                return true;
            }
            if (this.min_value != null && this.trueValue < min_value) {
                return true;
            }
            return false;
        }
    });
    Object.defineProperty(this, 'value', {
        get: function() {
            if (this.failed) {
                return this.def;
            }
            return this.trueValue;
        }
    });
}

// Devices
var vdevs = {};
vdevs["lights"] = {};
vdevs["switches"] = {};
vdevs["detectors"] = {};

// Add endpoints
vdevs["lights"]["bath_main"] = new OnOffSwitch("wb-mr6c_53/K2");
vdevs["lights"]["bath_hall"] = new OnOffSwitch("wb-mr6c_53/K1");
vdevs["switches"]["fan"] = new OnOffSwitch("wb-gpio/EXT5_R3A5");
vdevs["switches"]["GGK"] = new OnOffSwitch("wb-gpio/EXT5_R3A6");
vdevs["switches"]["Valve_HWS"] = new TimedOnSwitch("wb-gpio/EXT6_R3A1", 30);
vdevs["switches"]["Valve_Heating"] = new TimedOnSwitch("wb-gpio/EXT6_R3A2", 30);
vdevs["detectors"]["CH4"] = new BinaryDetector("wb-gpio/EXT2_DR14", true);
vdevs["detectors"]["CO_100"] = new BinaryDetector("wb-gpio/EXT2_DR13", true);
vdevs["detectors"]["T3"] = new ValueDetector("wb-w1/28-01183062d0ff", 100, 0, null);

// Share it
global.vdevs = vdevs;
