var storage = {};

storage.values = {
    fan_rest: 45,
    fan_active: 15,
    fan_bathroom: 10,
    // Time UTC
    fan_block_start: 22,
    fan_block_end: 6,
    // Temperature in C
    hws_target: 45,
    hws_hyst: 4
};

global.storage = storage;