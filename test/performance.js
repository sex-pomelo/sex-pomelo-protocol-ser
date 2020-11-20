var should = require('should');
var Protocol = require('../');
var Package = Protocol.Package;
var Message = Protocol.Message;

let testCnt = 1000000;
let sTime = 0;


let str = '你好, abc~~~';


sTime = (new Date()).valueOf();

for( let i=0;i<testCnt;i++ )
{
    let buf = Protocol.strencode(str);
    Protocol.strdecode(buf);
}

console.log('String  encode and decode waste time:', (new Date()).valueOf() - sTime, 'ms'  );


///////////// Package encode and decode
sTime = (new Date()).valueOf();
for( let i=0;i<testCnt;i++ )
{
    let msg = 'hello world~';
    let buf = Package.encode(Package.TYPE_DATA, Protocol.strencode(msg));
    Package.decode(buf);
}

console.log('Package encode and decode waste time:', (new Date()).valueOf() - sTime, 'ms'  );


sTime = (new Date()).valueOf();

//let msg = 'hello world~';
//let buf = Package.encode(Package.TYPE_DATA, Protocol.strencode(msg));

for( let i=0;i<testCnt;i++ )
{
    let compress = 0;
    let route = 'connector.entryHandler.entry';
    let msg = 'hello world~';
    let buf = Message.encode(0, Message.TYPE_NOTIFY, compress,
                             route, Protocol.strencode(msg));
    Message.decode(buf);
}

console.log('message encode and decode waste time:', (new Date()).valueOf() - sTime, 'ms'  );

