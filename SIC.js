console.time('執行時間');
var fs = require('fs');
var readline = require('readline');
const opTable = new Map();
//初始化
const SymbolTable = [];
var midData ='';
const tmp = {};
const error = [];

//讀入opCode
var inputStream = fs.createReadStream('opCode.txt');
var lineReader = readline.createInterface({ input: inputStream });
lineReader.on('line', function(line) {
    let x = line.toString().trim().split(' ')  // /[ \t]/g
    opTable.set(x[0],x[1]);
});

//讀入asm
var inputStream2 = fs.createReadStream('(test)SIC.asm');

var lineReader2 = readline.createInterface({ input: inputStream2 });
var no = 1;
var loc = 0;
lineReader2.on('line', function(line) {
    //中間檔格式
    tmp[no]={
        line: no, 
        loc:'null', 
        label: 'null', 
        Mnemonic: 'null', 
        oprand: 'null', 
        opCode: 'null', 
        Addressing: 'null'
    }
    //去除註解
    if(line.includes('.'))
        line = line.substring(0,line.indexOf('.')-1)
    //判斷index 
    if(line.match(/,(?:\s)*X/)){
        tmp[no].Addressing = 'index';
    }
    let inputdata = line.toString().trim().split(' ')
    //console.log(`${inputdata}  `);
    // if(tmp[no].Addressing == 'index')
    //     console.log(`${inputdata}  `);
    
    //2欄轉成3欄(指令),排除RSUB的情況,label補為null
    //if(inputdata.length ==1 && !inputdata)
    if(inputdata.length ==2){
        tmp[no].Mnemonic = inputdata[0];
        tmp[no].oprand = inputdata[1];
    }
    if(inputdata.length ==3){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
    }
    //程式開始 設定起始location
    if(inputdata.includes('START')){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        //tmp[no].loc = inputdata[2] ;
        tmp[no].loc = '0000'.substring(0,4-inputdata[2].length) + inputdata[2];
        //if(tmp[no].loc)
        loc = parseInt(inputdata[2],16);
    }

    if(inputdata.includes('END')){
        tmp[no].label=inputdata[inputdata.indexOf('END')-1];
        tmp[no].Mnemonic = inputdata[inputdata.indexOf('END')];
        tmp[no].oprand = inputdata[inputdata.indexOf('END')+1];
        //tmp[no].loc = loc.toString(16);
        tmp[no].loc = '0000'.substring(0,4-loc.toString(16).length) + loc.toString(16);
    }

    //loc 特殊情況計算
    if(inputdata[1]=='BYTE'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        //tmp[no].loc = loc.toString(16);
        tmp[no].loc = '0000'.substring(0,4-loc.toString(16).length) + loc.toString(16);
        tmp[no].Addressing = 'direct';
        if(tmp[no].oprand.charAt(0) == 'C' && tmp[no].oprand.charAt(1) == "'" && tmp[no].oprand.charAt(tmp[no].oprand.length-1) == "'")
            loc =loc + (inputdata[2].length-3);
        else if(tmp[no].oprand.charAt(0) == 'X' && tmp[no].oprand.charAt(1) == "'" && tmp[no].oprand.charAt(tmp[no].oprand.length-1) == "'"){
            loc =loc + (tmp[no].oprand.length-3)/2;
            //ERROR : X''中字串長度不能為奇數
            if((tmp[no].oprand.length-3)%2 != 0){
                let errorStr = 'line:' + no  + ' ERROR ' + tmp[no].oprand + " X''中字串長度須為偶數!"
                error.push(errorStr);
            }
        }
        //ERROR: BYTE型態錯誤
        else{
            let errorStr = 'line:' + no  + ' ERROR ' + tmp[no].oprand + ' BYTE型態錯誤!'
            error.push(errorStr);
        }
    }
    if(inputdata[1]=='RESB'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        //tmp[no].loc = loc.toString(16);
        tmp[no].loc = '0000'.substring(0,4-loc.toString(16).length) + loc.toString(16);
        tmp[no].Addressing = 'direct';
        loc = loc + parseInt(inputdata[2],10);
    }
    if(inputdata[1]=='RESW'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        //tmp[no].loc = loc.toString(16);
        tmp[no].loc = '0000'.substring(0,4-loc.toString(16).length) + loc.toString(16);
        tmp[no].Addressing = 'direct';
        //console.log(typeof (inputdata[2]*3))
        loc = loc + inputdata[2]*3;
    }
    if(inputdata[1]=='WORD'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        //tmp[no].loc = loc.toString(16);
        tmp[no].loc = '0000'.substring(0,4-loc.toString(16).length) + loc.toString(16);
        tmp[no].Addressing = 'direct';
        loc = loc + 3;
    }
    if(inputdata.includes('RSUB')){
        if(inputdata.indexOf('RSUB')-1 == 0)
            tmp[no].label=inputdata[inputdata.indexOf('RSUB')-1];
        tmp[no].oprand = 'null';
        tmp[no].opCode =opTable.get('RSUB');
        tmp[no].Addressing = 'null';
        loc = loc;
        //ERROR: RSUB後面有oprand
        if(inputdata.indexOf('RSUB') != inputdata.length-1){
            tmp[no].oprand = inputdata[inputdata.length-1];
            let errorStr = 'line:' + tmp[no].line  + ' ERROR ' + 'RSUB ' + tmp[no].oprand + ' RSUB後不能有東西!'
            error.push(errorStr);
        }
    }
    
    if (opTable.has(inputdata[0])){
        if(!inputdata.includes('RSUB'))
            tmp[no].oprand = inputdata[1];
        //tmp[no].loc = loc.toString(16);
        tmp[no].loc = '0000'.substring(0,4-loc.toString(16).length) + loc.toString(16);
        tmp[no].label = 'null';
        tmp[no].Mnemonic = inputdata[0];
        tmp[no].opCode = opTable.get(inputdata[0]);
        if(tmp[no].Addressing == 'index')
            tmp[no].Addressing == 'index'
        else
            tmp[no].Addressing = 'direct';
        loc = loc + 3;
    }
    if(opTable.has(inputdata[1])){
        if(!inputdata.includes('RSUB'))
            tmp[no].oprand = inputdata[2];
        //tmp[no].loc = loc.toString(16);
        tmp[no].loc = '0000'.substring(0,4-loc.toString(16).length) + loc.toString(16);
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].opCode = opTable.get(inputdata[1]);
        if(tmp[no].Addressing == 'index')
            tmp[no].Addressing == 'index'
        else
            tmp[no].Addressing = 'direct';
        loc = loc + 3;
    }
    
    if(inputdata.length ==1 && !inputdata.includes('RSUB') && !inputdata.includes('') ){
        tmp[no]={
            line: no, 
            loc:'null', 
            label: 'null', 
            Mnemonic: 'null', 
            oprand: 'null', 
            opCode: 'null', 
            Addressing: 'null'
        }
        let errorStr = 'line:' + no  + ' ERROR ' + inputdata[0] + ' 無效輸入!'
        error.push(errorStr);
    }
    if(tmp[no].oprand.match(',')){
        tmp[no].oprand = tmp[no].oprand.substring(0,tmp[no].oprand.indexOf(','));
    }
    //ERROR: 重複定義
    if(tmp[no].label != 'null' && !SymbolTable.includes(tmp[no].label)) //.includes
        SymbolTable.push(tmp[no].label,tmp[no].loc); 
    else if(tmp[no].label != 'null' && SymbolTable.includes(tmp[no].label)){ //.includes
        let errorStr = 'line:' + tmp[no].line  + ' ERROR ' + tmp[no].label + ' redefined!'
        error.push(errorStr);
    }

    //ERROR: label & Mnemonic 撞名
    if(tmp[no].label != 'null' && tmp[no].label == tmp[no].Mnemonic){
        let errorStr = 'line:' + tmp[no].line  + ' ERROR ' + tmp[no].label + ' ' + tmp[no].Mnemonic + ' Label不可與Mnemotic相同'
        error.push(errorStr);
    }
    if(tmp[no].label != 'null'){
        var symbolData = tmp[no].label + ' ' + tmp[no].loc + '\n';
        fs.appendFile("./SymbolTab.txt",symbolData , function (err){
            if (err) console.log(err)
        });
    }
    midData = no + ' ' + tmp[no].loc + ' ' + tmp[no].label + ' ' + tmp[no].Mnemonic + ' ' + tmp[no].oprand + ' ' + tmp[no].opCode + ' ' + tmp[no].Addressing + '\n';
    fs.appendFile("./middle.txt",midData , function (err){
        if (err) console.log(err)
    });//appendFile
    
    //寫入中間檔
    fs.writeFile("./middle.json",JSON.stringify(tmp), (err) => {
        if (err) console.log(err)
    });
    fs.writeFile("./SymbolTable.json",JSON.stringify(SymbolTable), (err) => {
        if (err) console.log(err)
    });
    fs.writeFile("./error.json",JSON.stringify(error), (err) => {
        if (err) console.log(err)
    });
    
    no ++;
});

console.timeEnd('執行時間');
