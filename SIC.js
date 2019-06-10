var fs = require('fs');
var readline = require('readline');
const SymbolTable = new Map();
const tmp = require("./middle.txt");
//const error = require("./error.json");

//讀入opCode
var inputStream = fs.createReadStream('opCode.txt');
var lineReader = readline.createInterface({ input: inputStream });
lineReader.on('line', function(line) {
    let x = line.toString().trim().split(' ')
    SymbolTable.set(x[0],x[1]);

});
//讀入asm
var inputStream2 = fs.createReadStream('(test)SIC.asm');

var lineReader2 = readline.createInterface({ input: inputStream2 });
var no = 1;
var loc = 0;
lineReader2.on('line', function(line) {
    //var inputvalue = false;
    var checkAddressing = -1;
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

    if(inputdata.includes('START')){
        //inputvalue = true;
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = inputdata[2] ;
        loc = parseInt(inputdata[2],16);
    }

    if (SymbolTable.has(inputdata[0])){
        checkAddressing++;
        inputvalue = true;
        tmp[no].loc = loc.toString(16);
        tmp[no].Mnemonic = inputdata[0];
        tmp[no].oprand = inputdata[1];
        tmp[no].opCode = SymbolTable.get(inputdata[0]);
        tmp[no].Addressing = 'direct';
        loc = loc + 3;
    }
    if(SymbolTable.has(inputdata[1])){
        checkAddressing++;
        inputvalue = true;
        tmp[no].loc = loc.toString(16);
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].opCode = SymbolTable.get(inputdata[1]);
        tmp[no].Addressing = 'direct';
        // if(checkAddressing == 1)
        //     tmp[no].Addressing = 'index'
        // else if(checkAddressing == 0)
        //     tmp[no].Addressing = 'direct'
        loc = loc + 3;
    }
    if(inputdata.includes('BUFFER,')){
        tmp[no].Addressing = 'index';
        inputdata[inputdata.indexOf('X') - 1] = inputdata[inputdata.indexOf('X') - 1] + "X"
    }
    if(inputdata.includes('END')){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = loc.toString(16);
        console.log(tmp[no].loc)
        console.log("End of the program!")
    }
    //loc 特殊情況
    if(inputdata[1]=='BYTE'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = loc.toString(16);
        tmp[no].Addressing = 'direct';
        if(inputdata[2].includes('C'))
            loc =loc + (inputdata[2].length-3)
        if(inputdata[2].includes('X'))
            loc =loc +1;
    }
    if(inputdata[1]=='RESB'){
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = loc.toString(16);
        tmp[no].Addressing = 'direct';
        //console.log(parseInt(inputdata[2],10).toString(16));
        //console.log(parseInt(parseInt(inputdata[2],10).toString(16),10));
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
        tmp[no].opCode =SymbolTable.get('RSUB');
        tmp[no].Addressing = 'NULL';
        loc = loc;
    }
    //console.log(tmp[no].loc)

    var midData = tmp[no].loc + ' ' + tmp[no].label + ' ' + tmp[no].Mnemonic + ' ' + tmp[no].oprand + ' ' + tmp[no].opCode + ' ' + tmp[no].Addressing + '\n';
    fs.appendFile("./middle.txt",midData , function (err){
        if (err) console.log(err)
    });

    fs.writeFile("./middle.json",JSON.stringify(tmp), (err) => {
        if (err) console.log(err)
    });

    // fs.writeFile("./middle.txt",JSON.stringify(tmp) ,(err) => {
    //     if (err) console.log(err)
    // });
    // fs.appendFile("./error.json",JSON.stringify(error),(err) => {
    //     if (err) console.log(err)
    // });
    //console.log(tmp[label])
    no ++;
});

