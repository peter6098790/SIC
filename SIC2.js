var fs = require('fs');
//var readline = require('readline');
//const SymbolTable = new Map();
const tmp = require("./middle.json");
//const error = require("./error.txt");
const errTable = new Map();

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
function getLabelLoc(Target){
    for (var key in tmp) {
        if(tmp[key].label == Target)
            return parseInt(tmp[key].loc,16)
    }
}
function checkRedefined(){
    //label中已經出現過又不是null的
}
function getLabel(){
    let labelArr = [];
    for (var key in tmp) {
        if(tmp[key].label !='null' && tmp[key].label !='END')
            labelArr.push(tmp[key].label);
    }
    return labelArr;
}
async function checkUndefined(){
    let oprand;
    let labelArr = await getLabel();
    let errorStr = '為未定義的Symbol'
    for (var key in tmp) {
        if(tmp[key].Mnemonic != ('null') && tmp[key].Mnemonic != 'START' && tmp[key].Mnemonic != 'END' && tmp[key].Mnemonic != 'WORD' && tmp[key].Mnemonic != 'BYTE' && tmp[key].Mnemonic != 'RESW' && tmp[key].Mnemonic != 'RESB' ){
            oprand = tmp[key].oprand;
            if(labelArr.indexOf(oprand)== -1){
                errorStr = tmp[key].oprand + errorStr;
                errTable.set(tmp[key].line,errorStr)
            }
        }
        if(tmp[key].oprand == ('BUFFER,X'))
            oprandArr = 'BUFFER' ;
            if(labelArr.indexOf(oprand)== -1){
                errorStr = tmp[key].oprand + errorStr;
                errTable.set(tmp[key].line,errorStr)
            }
    }
    // fs.appendFile("./error.txt",errTable , function (err){
    //     if (err) console.log(err)
    // });
//不是null&&mnemonic不適start,end,word,...label又查不到的
}
function checkMnemonicError(){
    for (var key in tmp) {
        if(tmp[key].Mnemonic !== 'START' || 'END ' || 'WORD' || 'BYTE' || 'RESB' || 'RESW' && !tmp[key].opCode)
            return tmp[key].line,tmp[key].Mnemonic;
    }
}

//產生object code
async function generateObjCode(){
    var objectCode;
    var objCodeTable = new Map(); // key: line. value:[objcode,loc]
    for (var key in tmp){
        if(tmp[key].Mnemonic != 'null' && tmp[key].Mnemonic != 'START' &&  tmp[key].label !='END' && tmp[key].Mnemonic !='RESW' && tmp[key].Mnemonic !='RESB' ){
            let oprand ;

            if(tmp[key].Addressing == 'direct'){
                oprand = await getLabelLoc(tmp[key].oprand);
                objectCode = tmp[key].opCode.toString() + parseInt(oprand,10).toString(16);
                objCodeTable.set(tmp[key].line,objectCode);
            }
            if(tmp[key].Addressing == 'index'){
                oprand = await getLabelLoc('BUFFER');
                objectCode = tmp[key].opCode.toString() + (oprand+parseInt(8000,16)).toString(16);
                objCodeTable.set(tmp[key].line,objectCode);
            }
        }

        if(tmp[key].Mnemonic =='RSUB'){
            objectCode = tmp[key].opCode.toString() + '0000'
            objCodeTable.set(tmp[key].line,objectCode);
        }
        if(tmp[key].Mnemonic == 'BYTE'){
            if(tmp[key].oprand.charAt(0) == 'X'){
                //若X後長度>2 => error
                objectCode = tmp[key].oprand.substring(2,4)
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
    //console.log(objCodeTable);
}

//Object Program
//組裝H部分
async function getHeader(){
    let head = await checkloc('START');
    let label = await checkLabel('START')
    let end = await checkloc('END');
    let header = 'H' + ' ' + label + ' ' + '00' + head.toString(16) + ' ' + '00' + (end-head).toString(16);
    return header;
}

//組裝T部分
async function getBody(){
    let str=' ';
    let bodyArr = [];
    let locArr = [];
    let Tlength = 0;
    let objCodeTable = await generateObjCode();
    let nextLine = false;
    for (var key in tmp) {
        let value = objCodeTable.get(parseInt(key));
        //遇到RE兄弟換行
        
        if(tmp[key].Mnemonic =='RESB' || tmp[key].Mnemonic =='RESW')
            nextLine = true;
        //結束push
        if(tmp[key].label == 'END'){
            // if(Tlength.toString(16).length == 1)
            //     Tlength.toString(16) = '0' + Tlength.toString(16);
            str = 'T ' + '00' + locArr[0] + ' ' + Tlength.toString(16) + str;
            bodyArr.push(str);
        }
        if(objCodeTable.has(tmp[key].line)){
            locArr.push(tmp[key].loc);
            if(Tlength + parseInt(value.length/2) <= 30){
                if( nextLine == true ){
                    if(Tlength.length <2)
                        Tlength.toString(16) = '0' + Tlength.toString(16);
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
                if(Tlength.length <2)
                    Tlength.toString(16) = '0' + Tlength.toString(16);
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
getBody();
//組裝E部分
async function getTail(){
    let target = await checkOprand('END');
    let end = await checkloc(target)
    let ender = 'E' + ' ' + '00' + end.toString(16);
    return ender;
}
async function showObjProgram(){
    let headStr = await getHeader();
    let endStr  = await getTail();
    let body    = await getBody();
    let bodyStr = '';
    body.forEach(element => {
        bodyStr = bodyStr + element + '\n';
    });
    console.log(headStr + '\n' + bodyStr + endStr);
}
showObjProgram();



