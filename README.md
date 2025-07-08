#sex-pomelo-protocol

Encode and decode binary protocol for Pomelo framework Server( **not use client, only run in node runtime** ). Nodejs version need >= 8.x 

More details about Pomelo Protocol, please refer
[Pomelo Protocol](https://github.com/NetEase/pomelo/wiki/Pomelo-%E5%8D%8F%E8%AE%AE)
and
[Pomelo data compression](https://github.com/NetEase/pomelo/wiki/Pomelo-%E6%95%B0%E6%8D%AE%E5%8E%8B%E7%BC%A9%E5%8D%8F%E8%AE%AE).


# ChangeLog

## 1.0.0 / 2025-07-08

* update deps
* opt Message.encode ( use `pomelo-coderx` )
* add types

**Break Change**

* `route` must ascii string.


## older
 * 0.1.10 fix opt-in package name error
 * 0.1.9, Opt-in for performance and spec compliance
   * `npm install --save-optional @sex-pomelo/pomelo-coderx` : Allows to efficiently perform operations for Message.encode
 * 0.1.8, Improve Package / Message decode performance
 * 0.1.7, performance opt. Nodejs version need >= 8.x 
