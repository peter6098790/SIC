var fs = require('fs');
var readline = require('readline');
const SymbolTable = new Map();
const tmp = require("./middle.json");

//預處理:讀入opCode.txt
var inputStream = fs.createReadStream('opCode.txt');
var lineReader = readline.createInterface({ input: inputStream });
lineReader.on('line', function(line) {
    let x = line.toString().trim().split(' ')
    SymbolTable.set(x[0],x[1]);

});
//讀入prog
var inputStream2 = fs.createReadStream('(test)SIC.asm');

var lineReader2 = readline.createInterface({ input: inputStream2 });
var no = 1;
var loc = 0;
lineReader2.on('line', function(line) {
    var inputvalue = false;
    var checkAddressing = -1;

    let inputdata = line.toString().trim().split(' ')
    console.log(`${inputdata}  `);

    //中間檔格式
    tmp[no]={
        line: no, loc: 0, label: 'NULL', Mnemonic: 'NULL', oprand: 'NULL', opCode: 'NULL', Addressing: 'NULL'
    }
    if(inputdata.includes('START')){
        inputvalue = true;
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].loc = inputdata[2];
        loc = parseInt(parseInt(inputdata[2],16),16);
        console.log(loc +1);
        // console.log(`Program name is: ${inputdata[0]}`)
        // console.log("start from this line\n")
        console.log(`start from loc : ${loc}`)
    }
    // if(inputdata.includes('END')){
    //     console.log("End of the program!")
    //     process.exit(0);
    // }

    //index addressing 
    if(inputdata.includes('BUFFER')){
        checkAddressing = 0;
        inputdata[inputdata.indexOf('X') - 1] = inputdata[inputdata.indexOf('X') - 1] + "X"
    }
    // //check Mnemonic is effective or not
    if (SymbolTable.has(inputdata[0])){
        checkAddressing++;
        inputvalue = true;
        tmp[no].Mnemonic = inputdata[0];
        tmp[no].oprand = inputdata[1];
        tmp[no].opCode = SymbolTable.get(inputdata[0])
        if(checkAddressing == 1)
            tmp[no].Addressing = 'index'
        else if(checkAddressing == 0)
            tmp[no].Addressing = 'direct'
    }
    if(SymbolTable.has(inputdata[1])){
        checkAddressing++;
        inputvalue = true;
        tmp[no].label = inputdata[0];
        tmp[no].Mnemonic = inputdata[1];
        tmp[no].oprand = inputdata[2];
        tmp[no].opCode = SymbolTable.get(inputdata[1])
        if(checkAddressing == 1)
            tmp[no].Addressing = 'index'
        else if(checkAddressing == 0)
            tmp[no].Addressing = 'direct'
        //console.log(`Label:${inputdata[0]} Mnemonic:${inputdata[1]}     oprand:${inputdata[2]}\n`)
    }
    
    fs.writeFile("./middle.json",JSON.stringify(tmp),(err) => {
        if (err) console.log(err)
    });
    no ++;
});

