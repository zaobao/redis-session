var poolModule = require("generic-pool");
var redis = require("redis");

var redisPool = poolModule.Pool({
  name: "redis",
  create: function (callback) {
    var client = redis.createClient(6379, "127.0.0.1");
    client.select("1");
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    client.auth("xxxxxxxx");
    callback(null, client);
  },
  destroy: function (client) {
    client.quit();
  },
  max: 1000,
  min: 1,
  idleTimeoutMillis: 180000,
  log: false,
  priorityRange: 3
  }
);

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
  session.id = undefined;
  session.storage = {};
  session.ifModified = false;
  redisPool.acquire(function(err, client) {
    client.hdel(session.id,function (err, reply) {
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
  function randomChar(l) {
    var x="123456789poiuytrewqasdfghjklmnbvcxzQWERTYUIPLKJHGFDSAZXCVBNM";
    var tmp="";
    for(var i=0;i< l;i++) {
      tmp += x.charAt(Math.ceil(Math.random() * 100000000) % x.length);
    }
    return tmp;
  }
  function createSession(client) {
    var id = randomChar(36);
    client.hsetnx(id, "id", id, function (err, reply) {
      console.log(id);
      if (reply === 0) {
        createSession(client);
      } else if (reply === 1) {
        client.expire(id, 600, function (err, reply) {
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
  if (typeof(this.cookie.sessionId) === "string") {
    id = this.cookie.sessionId;
    redisPool.acquire(function (err, client) {
      client.hgetall(id, function (err, reply) {
        if (reply != undefined) {
          client.expire(id, 600, function (err, reply) {
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
  this.session = session;
  this.setHeader("Set-Cookie" , "sessionId=" + this.session.id + "; Path=/"
  //+ "; Secure"
  + "; HttpOnly" + "; Max-Age=600");
  if (session.ifModified === true) {
    redisPool.acquire(function (err, client) {
      client.multi ([
        ["del", session.id],
        ["hmset", session.id, session.storage],
        ["expire", session.id, 600]
      ]).exec(function (err, reply) {
        redisPool.release(client);
      });
    });
  }
}

function useSession(request, response) {
  var session = new Session;
  request.session = session;
  response.session = session;
  request.getSession = getSession;
  response.setSession = setSession;
  response.endWithSession = function (a1, a2) {
    console.log(this.session);
    this.setSession(this.session);
    this.end(a1, a2);
  }
}

exports.useSession = useSession
