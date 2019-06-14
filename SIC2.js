console.time('執行時間');
var fs = require('fs');
//var readline = require('readline');
const SymbolTable = require("./SymbolTable.json");
const tmp = require("./middle.json");
const error = require("./error.json");


//找location number
function checkloc(Target){
    for (var key in tmp) {
        if(tmp[key].label == Target){
            //console.log(parseInt(tmp[key].loc,16));
            return parseInt(tmp[key].loc,16);
            //return tmp[key].loc;
        }    
        if(tmp[key].Mnemonic == Target)
            return parseInt(tmp[key].loc,16);
        else if(tmp[key].oprand == Target)
            return parseInt(tmp[key].loc,16);
    }
}

function checkOprand(Target){
    for (var key in tmp) {
        if(tmp[key].Mnemonic == Target)
            return tmp[key].oprand;
    }
}

function checkLabel(Target){
    for (var key in tmp) {
        if(tmp[key].Mnemonic == Target)
            return tmp[key].label;
    }
}

function getLabelLoc(Target){
    for (var key in tmp) {
        if(tmp[key].label == Target){
            //let value = '0000'.substring(0,4-loc.toString(16).length) + loc.toString(16)
            let value = parseInt(tmp[key].loc,16)
            return parseInt(tmp[key].loc,16);
            //'0000'.substring(0,4-[key].loc.length) + parseInt(tmp[key].loc,16)
            //parseInt(tmp[key].loc,16);//tmp[key].loc//
        }
        //console.log(tmp[key].loc)
    }
}


function checkUndefined(){
    //不是null&&mnemonic不是start,end,word,...label又查不到的
    let oprand;
    for (var key in tmp) {
        if(tmp[key].Mnemonic != 'null' && tmp[key].Mnemonic != 'START'  && tmp[key].Mnemonic != 'WORD' && tmp[key].Mnemonic != 'BYTE' && tmp[key].Mnemonic != 'RESW' && tmp[key].Mnemonic != 'RESB' && tmp[key].Mnemonic != 'RSUB'){
            oprand = tmp[key].oprand;
            if(oprand != 'null' && SymbolTable[oprand]== -1){ //.includes
                let errorStr = 'line:' + tmp[key].line  + ' ERROR ' + oprand + ' undefned!'
                error.push(errorStr);
            }
        }
    }
    fs.writeFile("./error.json",JSON.stringify(error), (err) => {
        if (err) console.log(err)
    });
    return;
}
function checkMnemonicError(){
    for (var key in tmp) {
        if(tmp[key].Mnemonic != 'null' && tmp[key].Mnemonic != 'START' && tmp[key].Mnemonic != 'END' && tmp[key].Mnemonic != 'WORD' && tmp[key].Mnemonic != 'BYTE' && tmp[key].Mnemonic != 'RESB' && tmp[key].Mnemonic != 'RESW' && tmp[key].Mnemonic != 'RSUB' && tmp[key].opCode == 'null'){
            let errorStr = 'line:' + tmp[key].line  + ' ERROR ' + tmp[key].Mnemonic + ' MnemonicError!'
            error.push(errorStr);
        }
    }
    fs.writeFile("./error.json",JSON.stringify(error), (err) => {
        if (err) console.log(err)
    });
    return;
}

//產生object code
function generateObjCode(){
    var objectCode;
    var objCodeTable = new Map(); // key: line. value:[objcode,loc]
    for (var key in tmp){
        if(tmp[key].Mnemonic != 'null' && tmp[key].Mnemonic != 'START' &&  tmp[key].Mnemonic !='END' && tmp[key].Mnemonic !='RESW' && tmp[key].Mnemonic !='RESB' ){
            let oprand = SymbolTable[SymbolTable.indexOf(tmp[key].oprand)+1];
            if(tmp[key].Addressing == 'direct'){
                ///oprand =  getLabelLoc(tmp[key].oprand);
                //************** */問題is here *****************
                ///let locnumber = '0000'.substring(0,4-parseInt(oprand,10).toString(16).length) + parseInt(oprand,10).toString(16)
                objectCode = tmp[key].opCode.toString() + oprand ;//locnumber; 
                objCodeTable.set(tmp[key].line,objectCode);
            }
            if(tmp[key].Addressing == 'index'){
                //oprand =  SymbolTable[SymbolTable.indexOf(tmp[key].oprand)+1];
                //let locnumber = '0000'.substring(0,4-(oprand+parseInt(8000,16)).toString(16).length) + (oprand+parseInt(8000,16)).toString(16)
                let locnumber = '0000'.substring(0,4-((parseInt(oprand,16)+parseInt(8000,16))).toString(16).length) + (parseInt(oprand,16)+parseInt(8000,16)).toString(16)
                objectCode = tmp[key].opCode.toString() + locnumber      //(oprand+parseInt(8000,16)).toString(16);
                objCodeTable.set(tmp[key].line,objectCode);
            }
        }

        if(tmp[key].Mnemonic =='RSUB'){
            objectCode = tmp[key].opCode.toString() + '0000'
            objCodeTable.set(tmp[key].line,objectCode);
        }
        if(tmp[key].Mnemonic == 'BYTE'){
            if(tmp[key].oprand.charAt(0) == 'X'){
                objectCode = tmp[key].oprand.substring(2,tmp[key].oprand.length-1)
                objCodeTable.set(tmp[key].line,objectCode);
            }
            if(tmp[key].oprand.charAt(0) == 'C'){
                objectCode = tmp[key].oprand.substring(2,tmp[key].oprand.length-1)
                var tmp1 = objectCode;
                objectCode = ''
                for(var i = 0 ; i < tmp1.length ; i++ ){
                    objectCode = objectCode + tmp1.charCodeAt(i).toString(16);
                }
                objCodeTable.set(tmp[key].line,objectCode);
            }
        }
        if(tmp[key].Mnemonic == 'WORD'){
            objectCode = parseInt(tmp[key].oprand,10).toString(16);
            while(objectCode.length < 6){
                objectCode = '0' + objectCode;
            }
            objCodeTable.set(tmp[key].line,objectCode);
        }
    }
    return objCodeTable;
}

//Object Program
//組裝H部分
function getHeader(){
    let head =  checkloc('START');
    let label = checkLabel('START');

    let head_4 = '0000'.substring(0,4-checkloc(checkLabel('START')).toString(16).length) + checkloc(checkLabel('START')).toString(16);
    let end =  checkloc('END');
    let header = 'H' + ' ' + label + ' ' + '00' + head_4 + ' ' + '00' + (end-head).toString(16);
    //checkloc(label).toString(16)
    return header;
}
//組裝E部分
function getTail(){
    let target =  checkOprand('END');
    let end =  getLabelLoc(target);
    let end_4 = '0000'.substring(0,4-end.toString(16).length) + end.toString(16);
    let ender = 'E' + ' ' + '00' + end_4;
    return ender;
    
}
//組裝T部分
function getBody(){
    let str=' ';
    let bodyArr = [];
    let locArr = [];
    let Tlength = 0;
    let objCodeTable =  generateObjCode();
    let nextLine = false;
    for (var key in tmp) {
        let value = objCodeTable.get(parseInt(key));
        
        //遇到RE兄弟換行
        if(tmp[key].Mnemonic =='RESB' || tmp[key].Mnemonic =='RESW')
            nextLine = true;
        //結束push
        if(tmp[key].Mnemonic == 'END'){
            str = 'T ' + '00' + locArr[0] + ' ' + Tlength.toString(16) + str;
            bodyArr.push(str);
        }
        if(objCodeTable.has(tmp[key].line)){
            locArr.push(tmp[key].loc);
            if(Tlength + parseInt(value.length/2) <= 30){
                if( nextLine == true ){
                    str = 'T ' + '00' + locArr[0] + ' ' + Tlength.toString(16) + str;
                    bodyArr.push(str);
                    nextLine = false;
                    str = ' ' + value.toString() + '^';
                    Tlength = parseInt(value.length/2);
                    locArr = [];
                    locArr.push(tmp[key].loc);
                }else{
                    str = str + value.toString() + '^';
                    Tlength = Tlength + parseInt(value.length/2);
                }
            }else if(Tlength + parseInt(value.length/2) >30 ){
                str = 'T ' + '00' + locArr[0] + ' ' + Tlength.toString(16) + str;
                bodyArr.push(str);
                str = ' ' + value.toString() + '^';
                Tlength = parseInt(value.length/2);
                locArr = [];
                locArr.push(tmp[key].loc);
            }
        }
    }
    return bodyArr;
}

function showObjProgram(){
    let headStr =  getHeader();
    let endStr  =  getTail();
    let body    =  getBody();
    let bodyStr = '';
    body.forEach(element => {
        bodyStr = bodyStr + element + '\n';
    });
    let ObjStr = headStr + '\n' + bodyStr + endStr;
    fs.writeFile("./ObjProgram.txt",ObjStr , function (err){
        if (err) console.log(err)
    });
    console.log(headStr + '\n' + bodyStr + endStr);
}

checkUndefined();
checkMnemonicError();
main();

//看error.json是否為空
function isEmpty(obj) { 
    for (var x in obj) { return false; }
    return true;
}
//如果沒error就show 有就console.log error
function main(){
    if(isEmpty(error))
        showObjProgram();
    else{
        error.forEach(element => {
            console.log(element);
        })
    }
}
console.timeEnd('執行時間');




