var config = {};	    
config.skipEmptyTextNodesForObj = true;
//config.arrayAccessForm = "property";
config.stripWhitespaces = true;
config.enableToStringFunc = false;
var x2js = new X2JS(config);

function loadXMLtoJSON(s) {
    var t;
    var s;
    var keys = {};
    var objects = {};
    var msg = 'Invalid XML entered.';
    if (s.trim() != "") {
        t = x2js.xml_str2json(s);
        if (_.keys(t).length === 1 && !_.isArray(t)) {
            t = t[_.keys(t)];
        }
        JSON.stringify(t, function (key, value) { if (_.isArray(value)) keys[key] = 1; if (_.isObject(value) && !_.isArray(value)) objects[key] = 1; return value; });
        t = JSON.stringify(t, function (key, value) {
            if (key === "__prefix") return undefined;
            if (key in keys && !_.isArray(value)) return [value];
            if (value === "" && key in objects && !(key in keys)) return undefined;
            return value;
        }, 3);
        if (t != "null" && t != "undefined") return t;
        alert(msg);
        return;
        if (!t || t == "null") { 
            alert(msg);
        }
    }
}