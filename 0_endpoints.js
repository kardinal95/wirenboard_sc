function Endpoint (device, control) {
    this.device = device;
    this.control = control;
}

Endpoint.prototype.get = function() {
    return dev[this.device][this.control];
}

Endpoint.prototype.set = function(value) {
    dev[this.device][this.control] = value;
}

Endpoint.prototype.enabled = function() {
    return dev[this.device][this.control] == true;
}

var endpoints = {};

endpoints["bathroom_main_light_sw"] = new Endpoint("wb-mr6c_53", "K2");
endpoints["bathroom_hall_light_sw"] = new Endpoint("wb-mr6c_53", "K1");
endpoints["home_cooler_sw"] = new Endpoint("wb-gpio", "EXT5_R3A5");

global.endpoints = endpoints;
