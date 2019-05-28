//  Copyright 2015 Data Design Group, Inc.  All Rights Reserved
// No! you cannot copy this file and use it.
function fixObjectArray(o)
{
    var names=["row","entry","key","item","node"];
    var s = JSON.stringify(o,null,'\t');
    var a = s.split(/\r\n|\n|\r/gm);
    var c,i,j,k,x,z;

    function isArrayNoName(text,stop) {
      var count = 0;
      var index = 0;
      while (text.charAt(index) === "\t") {
        count++;
        index++;
      }
      if (text.charAt(index)===stop)return count;
      else return -1;

    }
    for(j=0;j<a.length;j++) {
        x=isArrayNoName(a[j],'[');
        if(x>=0) {
           if(a[j].substring(j)==='[]') {
               a[j]='{ "' + names[x%names.length] + '": ' + a[j] + "}";
               continue;
           }
           if(a[j].substring(j)==='[],') {
               a[j]='{ "' + names[x%names.length] + '": ' + a[j].substring(0,a[j].length-1) + "},";
               continue;
           }
           a[j]='{ "' + names[x%names.length] + '": ' + a[j];
           for(k=j+1;k<a.length;k++) {
              c=isArrayNoName(a[k],']');
              if(c===x) {
                 z=a[k].slice(-1);
                 if(z===",") {
                     a[k]=a[k].substring(0, a[k].length - 1)+ "},";
                 }
                 else{ a[k]+= "}"; }
                 break;
              }
           }
        }
    }
    return a.join("\n");
}
//var obj=[ 99,"a",{"top":["dan"]},[1,2,"wow"],["dog","cat",{"a":[99,"fdsfsa",4444]}]];
//fixObjectArray(obj);
//JSON.stringify(JSON.parse(fixObjectArray(obj)),null,3)

//Object.prototype.renameProperty = function (oldName, newName) {

function renameBadKeyNames(o) {
    var newName="";
    for (var i in o) {
        if (o[i] !== null && typeof(o[i])=="object") {
            //going one step down in the object tree!!
            renameBadKeyNames(o[i]);
        }
        newName=i.trim().replace(/\s+/g,"_");
        if(i!=newName) {
            if (o.hasOwnProperty(i)) {
               o[newName] = o[i];
               delete o[i];
            } 
        }
    }
};

function sortObjectStringify(obj,spacer)
{

    function sortSingleObject(obj) {
      if(JSON.stringify(obj).substring(0,1)==='[')return obj;
      return Object.keys(obj).sort( function(k1, k2) {
             if (k1.toUpperCase() < k2.toUpperCase()) return -1;
             if (k1.toUpperCase() > k2.toUpperCase()) return 1;
             return 0;
          }).reduce(function (result, key) {
              result[key] = obj[key];
              return result;
            }, {});
    };
    
    return JSON.stringify(obj,
      function(key,value){
         if(JSON.stringify(value).substring(0,1)==='{') // an object but not array  _.isObject(value) && !_.isArray(value)
           return sortSingleObject(value);
         return value;
     }     ,spacer);
};

//alert(sortObjectStringify(myObj,3));







