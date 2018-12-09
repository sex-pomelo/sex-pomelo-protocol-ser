
const Protocol = module.exports;

  const PKG_HEAD_BYTES = 4;
  const MSG_FLAG_BYTES = 1;
  const MSG_ROUTE_CODE_BYTES = 2;
  const MSG_ID_MAX_BYTES = 5;
  const MSG_ROUTE_LEN_BYTES = 1;

  const MSG_ROUTE_CODE_MAX = 0xffff;

  const MSG_COMPRESS_ROUTE_MASK = 0x1;
  const MSG_COMPRESS_GZIP_MASK = 0x1;
  const MSG_COMPRESS_GZIP_ENCODE_MASK = 1 << 4;
  const MSG_TYPE_MASK = 0x7;

  const Package = Protocol.Package = {};
  const Message = Protocol.Message = {};

  Package.TYPE_HANDSHAKE = 1;
  Package.TYPE_HANDSHAKE_ACK = 2;
  Package.TYPE_HEARTBEAT = 3;
  Package.TYPE_DATA = 4;
  Package.TYPE_KICK = 5;

  Message.TYPE_REQUEST = 0;
  Message.TYPE_NOTIFY = 1;
  Message.TYPE_RESPONSE = 2;
  Message.TYPE_PUSH = 3;

  /**
   * pomele client encode
   * id message id;
   * route message route
   * msg message body
   * socketio current support string
   */
  Protocol.strencode = function(str) {
      // encoding defaults to 'utf8'
      return Buffer.from(str);
  };

  /**
   * client decode
   * msg String data
   * return Message Object
   */
  Protocol.strdecode = function(buffer) {
      // encoding defaults to 'utf8'
      return buffer.toString();
  };

  /**
   * Package protocol encode.
   *
   * Pomelo package format:
   * +------+-------------+------------------+
   * | type | body length |       body       |
   * +------+-------------+------------------+
   *
   * Head: 4bytes
   *   0: package type,
   *      1 - handshake,
   *      2 - handshake ack,
   *      3 - heartbeat,
   *      4 - data
   *      5 - kick
   *   1 - 3: big-endian body length
   * Body: body length bytes
   *
   * @param  {Number}    type   package type
   * @param  {ByteArray} body   body content in bytes
   * @return {ByteArray}        new byte array that contains encode result
   */
  Package.encode = function(type, body){
    let length = body ? body.length : 0;
    let buffer = Buffer.allocUnsafe(PKG_HEAD_BYTES + length);
    buffer[0] = type & 0xff;
    buffer[1] = (length >> 16) & 0xff;
    buffer[2] = (length >> 8) & 0xff;
    buffer[3] = length & 0xff;
    if(body) {
      body.copy(buffer, 4, 0, length);
    }
    return buffer;
  };

  /**
   * Package protocol decode.
   * See encode for package format.
   *
   * @param  {ByteArray} buffer byte array containing package content
   * @return {Object}           {type: package type, buffer: body byte array}
   */
  Package.decode = function(buffer){
    let offset = 0;
    let bytes = Buffer.from(buffer);
    let length = 0;
    let rs = [];
    while(offset < bytes.length) {
      let type = bytes[offset++];
      length = ((bytes[offset++]) << 16 | (bytes[offset++]) << 8 | bytes[offset++]) >>> 0;
      let body = length?bytes.slice(offset, offset+length):null;
      offset += length;
      rs.push({'type': type, 'body': body});
    }
    return rs.length === 1 ? rs[0]: rs;
  };

  /**
   * Message protocol encode.
   *
   * @param  {Number} id            message id
   * @param  {Number} type          message type
   * @param  {Number} compressRoute whether compress route
   * @param  {Number|String} route  route code or route string
   * @param  {Buffer} msg           message body bytes
   * @return {Buffer}               encode result
   */
  Message.encode = function(id, type, compressRoute, route, msg, compressGzip){
    // caculate message max length
    let idBytes = msgHasId(type) ? caculateMsgIdBytes(id) : 0;
    let msgLen = MSG_FLAG_BYTES + idBytes;

    if(msgHasRoute(type)) {
      if(compressRoute) {
        if(typeof route !== 'number'){
          throw new Error('error flag for number route!');
        }
        msgLen += MSG_ROUTE_CODE_BYTES;
      } else {
        msgLen += MSG_ROUTE_LEN_BYTES;
        if(route) {
          route = Buffer.from(route);
          if(route.length>255) {
            throw new Error('route maxlength is overflow');
          }
          msgLen += route.length;
        }
      }
    }

    if(msg) {
      msgLen += msg.length;
    }

    let buffer = Buffer.allocUnsafe(msgLen);
    let offset = 0;

    // add flag
    offset = encodeMsgFlag(type, compressRoute, buffer, offset, compressGzip);

    // add message id
    if(msgHasId(type)) {
      offset = encodeMsgId(id, buffer, offset);
    }

    // add route
    if(msgHasRoute(type)) {
      offset = encodeMsgRoute(compressRoute, route, buffer, offset);
    }

    // add body
    if(msg) {
      msg.copy( buffer, offset, 0, msg.length );
      offset = offset + msg.length;
    }

    return buffer;
  };


  /**
   * Message protocol decode.
   *
   * @param  {Buffer|Uint8Array} buffer message bytes
   * @return {Object}            message object
   */
  Message.decode = function(buffer) {
    let bytes =  Buffer.from(buffer);
    let bytesLen = bytes.length || bytes.byteLength;
    let offset = 0;
    let id = 0;
    let route = null;

    // parse flag
    let flag = bytes[offset++];
    let compressRoute = flag & MSG_COMPRESS_ROUTE_MASK;
    let type = (flag >> 1) & MSG_TYPE_MASK;
    let compressGzip = (flag >> 4) & MSG_COMPRESS_GZIP_MASK;

    // parse id
    if(msgHasId(type)) {
      let m = 0;
      let i = 0;
      do{
        m = parseInt(bytes[offset]);
        id += (m & 0x7f) << (7 * i);
        offset++;
        i++;
      }while(m >= 128);
    }

    // parse route
    if(msgHasRoute(type)) {
      if(compressRoute) {
        route = (bytes[offset++]) << 8 | bytes[offset++];
      } else {
        let routeLen = bytes[offset++];
        if(routeLen) {
          route = bytes.slice( offset, offset+routeLen ).toString();
        } else {
          route = '';
        }
        offset += routeLen;
      }
    }

    // parse body
    let bodyLen = bytesLen - offset;
    let body = bytes.slice( offset, offset + bodyLen );

    return {'id': id, 'type': type, 'compressRoute': compressRoute,
            'route': route, 'body': body, 'compressGzip': compressGzip};
  };


  var msgHasId = function(type) {
    return type === Message.TYPE_REQUEST || type === Message.TYPE_RESPONSE;
  };

  var msgHasRoute = function(type) {
    return type === Message.TYPE_REQUEST || type === Message.TYPE_NOTIFY ||
           type === Message.TYPE_PUSH;
  };


  let caculateMsgIdBytes = function(id) {
    let len = 0;
    do {
      len += 1;
      id >>= 7;
    } while(id > 0);
    return len;
  };


  let encodeMsgFlag = function(type, compressRoute, buffer, offset, compressGzip) {
    if(type !== Message.TYPE_REQUEST && type !== Message.TYPE_NOTIFY &&
       type !== Message.TYPE_RESPONSE && type !== Message.TYPE_PUSH) {
      throw new Error('unkonw message type: ' + type);
    }

    buffer[offset] = (type << 1) | (compressRoute ? 1 : 0);

    if(compressGzip) {
      buffer[offset] = buffer[offset] | MSG_COMPRESS_GZIP_ENCODE_MASK;
    }

    return offset + MSG_FLAG_BYTES;
  };


  let encodeMsgId = function(id, buffer, offset) {
    do{
      let tmp = id % 128;
      let next = Math.floor(id/128);

      if(next !== 0){
        tmp = tmp + 128;
      }
      buffer[offset++] = tmp;

      id = next;
    } while(id !== 0);

    return offset;
  };

  let encodeMsgRoute = function(compressRoute, route, buffer, offset) {
    if (compressRoute) {
      if(route > MSG_ROUTE_CODE_MAX){
        throw new Error('route number is overflow');
      }

      buffer[offset++] = (route >> 8) & 0xff;
      buffer[offset++] = route & 0xff;
    } else {
      if(route) {
        buffer[offset++] = route.length & 0xff;
        route.copy( buffer, offset, 0, route.length );
        offset += route.length;
      } else {
        buffer[offset++] = 0;
      }
    }

    return offset;
  };



module.exports = Protocol;
