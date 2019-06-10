var fs = require('fs');
var readline = require('readline');
//const SymbolTable = new Map();
const tmp = require("./middle.json");


var header;
var ender;

//找location number
function checkloc(Target){
    for (var key in tmp) {
        // if(tmp[key].element == Target)
        //     return [parseInt(tmp[key].loc,16),tmp[key].label]
        // else 
        if(tmp[key].label == Target)
            return parseInt(tmp[key].loc,16)
        if(tmp[key].Mnemonic == Target)
            return parseInt(tmp[key].loc,16)
        else if(tmp[key].oprand == Target)
            return parseInt(tmp[key].loc,16)
        //console.log(tmp[key].loc + ' ' + tmp[key].label + ' ' + tmp[key].Mnemonic + ' ' + tmp[key].oprand + ' ' + tmp[key].opCode + ' ' + tmp[key].Addressing)
    }
}
function checkOprand(Target){
    for (var key in tmp) {
        if(tmp[key].label == Target)
            return tmp[key].Mnemonic;
    }
}
function checkLabel(Target){
    for (var key in tmp) {
        if(tmp[key].Mnemonic == Target)
            return tmp[key].label;
    }
}


//Object Program
//組裝H部分
async function getHeader(){
    let head = await checkloc('START');
    let label = await checkLabel('START')
    let end = await checkloc('END');
    console.log(head)
    console.log(end)
    console.log(label)
    header = 'H' + ' ' + label + ' ' + '00' + head.toString(16) + ' ' + '00' + (end-head).toString(16);
    console.log(header);
    return header;
}

//組裝E部分
async function getTail(){
    let target = await checkOprand('END');
    let end = await checkloc(target)
    ender = 'E' + ' ' + '00' + end.toString(16);
    console.log(ender);
}

getHeader();
getTail();

