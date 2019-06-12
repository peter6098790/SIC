var fs = require('fs');
var readline = require('readline');
const opTable = new Map();
const SymbolTable = [];
const tmp = {};
const error = {};
// const tmp = require("./middle.json");
// const error = require("./error.json");

//讀入opCode
var inputStream = fs.createReadStream('opCode.txt');
var lineReader = readline.createInterface({ input: inputStream });
lineReader.on('line', function(line) {
    let x = line.toString().trim().split(' ') // /[ \t]/g
    opTable.set(x[0],x[1]);

});
//讀入asm
var inputStream2 = fs.createReadStream('(test)SIC.asm');

var lineReader2 = readline.createInterface({ input: inputStream2 });
var no = 1;
var loc = 0;
lineReader2.on('line', function(line) {
    //var checkAddressing = -1;
    //去除註解
    if(line.includes('.'))
        line = line.substring(0,line.indexOf('.')-1)

    let inputdata = line.toString().trim().split(' ')
    console.log(`${inputdata}  `);

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

    //2欄轉成3欄(指令),排除RSUB的情況,label補為null
    if(inputdata.length == 2 && !inputdata.includes('RSUB')){
        tmp[no].Mnemonic = inputdata[0];
        tmp[no].oprand = inputdata[1];
        tmp[no].loc = loc.toString(16);
        tmp[no].Addressing = 'direct';
        //loc = loc + 3;
    }

    //程式開始 設定起始location
    if(inputdata.includes('START')){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = inputdata[2] ;
        loc = parseInt(inputdata[2],16);
    }

    if (opTable.has(inputdata[0])){
        //checkAddressing++;
        if(!inputdata.includes('RSUB'))
            tmp[no].oprand = inputdata[1];
        tmp[no].loc = loc.toString(16);
        tmp[no].Mnemonic = inputdata[0];
        
        tmp[no].opCode = opTable.get(inputdata[0]);
        tmp[no].Addressing = 'direct';
        loc = loc + 3;
    }
    if(opTable.has(inputdata[1])){
        //checkAddressing++;
        if(!inputdata.includes('RSUB'))
            tmp[no].oprand = inputdata[2];
        tmp[no].loc = loc.toString(16);
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].opCode = opTable.get(inputdata[1]);
        tmp[no].Addressing = 'direct';
        loc = loc + 3;
    }

    //oprand為index的調整
    if(inputdata.includes('BUFFER,')){
        tmp[no].Addressing = 'index';
        let oprand = inputdata[inputdata.indexOf('BUFFER,')] + "X";
        tmp[no].oprand = oprand;
    }
    if(inputdata.includes('BUFFER,X'))
        tmp[no].Addressing = 'index';
    
    if(inputdata.includes('END')){
        tmp[no].Mnemonic = inputdata[0];
        tmp[no].oprand = inputdata[1];
        tmp[no].loc = loc.toString(16);
    }

    //loc 特殊情況計算
    if(inputdata[1]=='BYTE'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = loc.toString(16);
        tmp[no].Addressing = 'direct';
        if(inputdata[2].includes('C'))
            loc =loc + (inputdata[2].length-3)
        //需要處理長度問題 不是固定2位
        if(inputdata[2].includes('X'))
            loc =loc +1;
    }
    if(inputdata[1]=='RESB'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = loc.toString(16);
        tmp[no].Addressing = 'direct';
        loc = loc + parseInt(inputdata[2],10);
    }
    if(inputdata[1]=='RESW'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = loc.toString(16);
        tmp[no].Addressing = 'direct';
        loc = loc + inputdata[2]*3;
    }
    if(inputdata[1]=='WORD'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = loc.toString(16);
        tmp[no].Addressing = 'direct';
        loc = loc + 3;
    }
    if(inputdata.includes('RSUB')){
        if(inputdata.indexOf('RSUB')-1 == 0)
            tmp[no].label=inputdata[inputdata.indexOf('RSUB')-1];
        tmp[no].opCode =opTable.get('RSUB');
        tmp[no].Addressing = 'NULL';
        loc = loc;
    }

    //重複定義ERROR
    if(tmp[no].label != 'null' && !SymbolTable.includes(tmp[no].label))
        SymbolTable.push(tmp[no].label);
    else if(tmp[no].label != 'null' && SymbolTable.includes(tmp[no].label)){
        error[no] = {
            line: tmp[no].line ,
            type: ' redefined',
            reason: ''
        }
        error[no].reason = tmp[no].label + error[no].type;
    }
    var midData = tmp[no].loc + ' ' + tmp[no].label + ' ' + tmp[no].Mnemonic + ' ' + tmp[no].oprand + ' ' + tmp[no].opCode + ' ' + tmp[no].Addressing + '\n';
    fs.appendFile("./middle.txt",midData , function (err){
        if (err) console.log(err)
    });

    //寫入中間檔
    // fs.open("./middle.json",w);
    // fs.open("./SymbolTable.json",w);
    // fs.open("./error.json",w);
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

