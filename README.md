redis-session
=============

Enable session with redis.

Installation
============

You are supposed to install both generic-pool and node_redis firstly.

Then download the script "session.js".

Useage
======  
    ss.useSession(request, response, pools.redisPool2, {sname: "SID", slength: 12});
      request.getSession(true, function(session) {
      session.setAttribute("2b","2b");
      response.endWithSession("Success!");
    });




