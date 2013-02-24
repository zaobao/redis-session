redis-session
=============

Enable session with redis.

Installation
============

You are supposed to install generic-pool and node_redis firstly.

Then download the script "session.js".

Useage
======
This project doesn't provide a cookie parser. Thus before using it, you must parse the cookie by yourself. For example:

    request.cookie = {};
    if (request.headers.hasOwnProperty("cookie")) {
      cookieString = request.headers.cookie;
      request.cookie = qs.parse(cookieString.replace(/\s+/g,""), ";", "=");
    }

Then you can use this Module as follows:
    var ss = require("./session.js");
    ss.useSession(request, response, pools.redisPool2, {sname: "SID", slength: 12});
    request.getSession(true, function(session) {
      session.setAttribute("username","redis-session");
      response.endWithSession("Success! " + session.Attribute("username"));
    });
    
This will display "Success! redis-session" in the page.

More examples can be obtained at sample/.

API
===
You may use this Module by `sessionModule = require("yourpath/session.js")`.

##sessionModule
###useSession(request, response, redisPool, [options])
The parameter `redisPool` is a connection pool you may define it with the module "generic-pool".





