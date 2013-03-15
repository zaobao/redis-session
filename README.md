redis-session
=============

Enable session with redis and cookie.

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

APIs
====
You may use this Module by `sessionModule = require("yourpath/session.js")`.

##sessionModule
###useSession(request, response, redisPool, [options])
* `redisPool` is a connection pool you may define it with the module "generic-pool".
* `options` is a optional argument and a object containing the parameters you can set for the session. If you want to set the expiry-time of session, you may define it as `{maxAge: xx}`. The obj can be depicted as:
```js

    options {
      sname:        //set the name of the sessionID,          default "sessionId"
      slength:      //set the length of the sessionID,        default 36      
      httpOnly:     //set the HttpOnly attribute of cookie,   default true      
      secure:       //set the HttpOnly attribute of cookie,   default false      
      maxAge:       //set the expiry-time of session(seconds),default 600      
    }               //you can set one or more of them

##request
###getSession(create, callback(session))

    request.getSession(true, function(session){
      //do something with session
    });

##Session
###getAttribute(attrName)
Return the value of the attribute.
###setAttribute(attrName, attrVal)
Set the value of the attribute. It's possible to delete the attribute with "setAttribute(attrName, undefined)".
###destroy(callback)
Invalid the session.

        session.destroy(function () {
         //the session has been destroyed, you may get a new one
         request.getSession(true, function (session) {
          //do something with the new session named also session
        })
      });

##response
###endWithSession()
If you want to make your session valid, you'd better use this function instead of `response.end()` to store and refresh the session. If the session has been destroyed, and you do not want a new one, you may also use the end() function. The author intends to keep the original interface pure. It should be avoided to use the method 'writeHead()' of 'response'.

LICENSE
=======
MIT License
