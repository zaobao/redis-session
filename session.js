function Session() {
  this.storage = {};
  this.ifModified = false;
};
function getAttributeByName(attrName) {
  return this.storage[attrName];
};
function setAttributeByName(attrName, attrVal) {
  if (this.storage[attrName] != attrVal) {
    this.storage[attrName] = attrVal;
    this.ifModified = true;
  }
};
function destroySession(callback) {
  session = this;
  var id = session.id;
  var redisPool = this.redisPool;
  session.id = undefined;
  session.storage = {};
  session.ifModified = false;
  redisPool.acquire(function(err, client) {
    client.del(id,function (err, reply) {
      redisPool.release(client);
      callback();
    });
  });
};
Session.prototype.getAttribute = getAttributeByName;
Session.prototype.setAttribute = setAttributeByName
Session.prototype.destroy = destroySession;

function getSession(create, callback) {
  var session = this.session;
  var id;
  var redisPool = this.sessionRedisPool;
  var length = this.sessionOptions.slength;
  var maxAge = this.sessionOptions.maxAge;
  function randomChar(l) {
    var x="123456789poiuytrewqasdfghjklmnbvcxzQWERTYUIPLKJHGFDSAZXCVBNM";
    var tmp="";
    for(var i=0;i< l;i++) {
      tmp += x.charAt(Math.ceil(Math.random() * 100000000) % x.length);
    }
    return tmp;
  }
  function createSession(client) {
    var id = randomChar(length);
    client.hsetnx(id, "id", id, function (err, reply) {
      if (reply === 0) {
        createSession(client);
      } else if (reply === 1) {
        client.expire(id, maxAge, function (err, reply) {
          redisPool.release(client);
        });
        session.id = id;
        session.storage.id = id;
        session.ifModified = true;
        callback(session);
      } else {
        redisPool.release(client);
        callback(undefined);
      }
    });
  }
  if (typeof(this.cookie[this.sessionOptions.sname]) === "string") {
    id = this.cookie[this.sessionOptions.sname];
    redisPool.acquire(function (err, client) {
      client.hgetall(id, function (err, reply) {
        if (reply != undefined) {
          client.expire(id, maxAge, function (err, reply) {
            redisPool.release(client);
          });
          session.id = id;
          session.storage = reply;
          callback(session);
        } else if (create === true) {
          createSession(client);
        } else {
          redisPool.release(client);
          callback(undefined);
        }
      });
    });
  } else if (create === true) {
    redisPool.acquire(function (err, client) {
      createSession(client);
    });
  } else {
    callback(undefined);
  }
}

function setSession(session) {
  var sname = this.sessionOptions.sname;
  var redisPool = this.sessionRedisPool;
  var maxAge = this.sessionOptions.maxAge;
  var secure = this.sessionOptions.secure ? "; Secure" : "";
  var httpOnly = this.sessionOptions.httpOnly ? "; HttpOnly" : "";
  this.session = session;
  if (this.session.id != undefined)
    this.setHeader("Set-Cookie" , sname + "=" + this.session.id + "; Path=/"
    + secure + httpOnly + "; Max-Age=" + maxAge);
  if (session.ifModified === true) {
    redisPool.acquire(function (err, client) {
      client.multi ([
        ["del", session.id],
        ["hmset", session.id, session.storage],
        ["expire", session.id, maxAge]
      ]).exec(function (err, reply) {
        redisPool.release(client);
      });
    });
  }
}

function useSession(request, response, sessionRedisPool, options) {
  var session = new Session;
  var sessionOptions = {};
  sessionOptions.sname = "sessionId";
  sessionOptions.slength = 36;
  sessionOptions.httpOnly = true;
  sessionOptions.maxAge = 600;
  sessionOptions.secure = false;
  if (options != undefined) {
    if (options.hasOwnProperty("sname")) {
      sessionOptions.sname = options.sname;
    };
    if (options.hasOwnProperty("slength")) {
      sessionOptions.slength = options.slength;
    };
    if (options.hasOwnProperty("httpOnly")) {
      sessionOptions.httpOnly = options.httpOnly;
    };
    if (options.hasOwnProperty("maxAge")) {
      sessionOptions.maxAge = options.maxAge;
    };
    if (options.hasOwnProperty("secure")) {
      sessionOptions.secure = options.secure;
    };
  }
  session.redisPool = sessionRedisPool;
  request.session = session;
  request.sessionRedisPool = sessionRedisPool;
  request.sessionOptions = sessionOptions;
  request.sessionRedisPool = sessionRedisPool;
  response.session = session;
  response.sessionRedisPool = sessionRedisPool;
  response.sessionOptions = sessionOptions;
  response.sessionRedisPool = sessionRedisPool;
  request.getSession = getSession;
  response.setSession = setSession;
  response.endWithSession = function (a1, a2) {
    this.setSession(this.session);
    this.end(a1, a2);
  }
}

exports.useSession = useSession;
