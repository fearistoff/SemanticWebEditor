function saveJSONtoXML(s) {
    if (s.trim() === "") {
        document.getElementById("txt1").focus();
        return;
    }
    var x2js = new X2JS();
    var xml = '<?xml version="1.0" encoding="UTF-8" ?>\n';
    try {
        try { (obj = JSON.parse(s)); }
        catch (e) {
            try { obj = eval('obj=(' + s + ')'); }
            catch (e) {
                try {
                    s = s.trim();
                    if (s.charAt(0) === '{' || s.charAt(0) === '[') {
                        obj = JSON.parse('[\n' + s.split('\n').join(',\n').replace(/,\s*$/, "") + '\n]');
                    } else {
                        alert('There is a problem with your JSON. ' + (e.Description ? e.Description : ""));
                        return;
                    }
                }
                catch (e) {
                    alert('Invalid JSON entered.' + (e.Description ? e.Description : ""));
                    return;
                }
            }
            s = JSON.stringify(obj);
        }
        if (!obj) { window.alert("Your JSON is not valid."); return; }
        renameBadKeyNames(obj);
        if (!_.isArray(obj) && (_.keys(obj).length > 1 || (_.keys(obj).length == 1 && _.isArray(obj[_.keys(obj)[0]])))) {
            obj = { "root": obj }; // object with multiple properties or one property of type array
        } else if (!_.isArray(obj) && _.keys(obj).length == 0) {
            obj = { "root": obj }; // empty object
        } else if (_.isArray(obj)) obj = { "root": { "row": obj } }; // If an array of objects do this
        if (obj) {
            s = fixObjectArray(obj);
            obj = JSON.parse(s);
        }
        s = x2js.json2xml_str(obj).replace(/\<-/gm, '<').replace(/\<\/-/gm, '</').replace(/\<#/gm, "<").replace(/\<\/#/gm, "</");
        return xml + pd.xml(s);
        document.getElementById("txta").value = xml + pd.xml(s);
    }
    catch (e) {
        alert("Invalid JSON entered " + (e.Description ? ":" + e.Description : ""));
    }
}