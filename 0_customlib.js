var customlib = {};

customlib.any_true = function (endpoints) {
    return !endpoints.every(is_false);
}

customlib.all_false = function (endpoints) {
    return endpoints.every(is_false);
}

customlib.as_ms = function (minutes) {
    return minutes * 60 * 1000;
}

function is_false(endpoint) {
    return !endpoint.enabled();
}

global.customlib = customlib;
