const SQL = require("../routes/snap_sql.js");
const Token = require("./snap_token.js");
const bcrypt = require("bcrypt");
const randToken = require("rand-token");
const MSSQL = SQL.MSSQL;
const dbSchema = "swpro";
class User {
  constructor() {
    this.user = null;
    this.lifespan = 20;
    this.data = {
      id: null,
      subscriberid: null,
      local: {
        id: null,
        username: null,
        password: null,
        token: null,
        appid: null,
        pageid: null,
        subscriberid: null,
      },
      azureAD: {
        id: null,
        token: null,
        email: null,
        name: null,
        phone: null,
        mobile: null,
        username: null,
        title: null,
        expires: null,
        scope: null,
        refreshtoken: null,
        code_verifier: null,
      },
      facebook: {
        id: null,
        token: null,
        email: null,
        name: null,
      },
      google: {
        id: null,
        token: null,
        email: null,
        name: null,
      },
      linkedin: {
        id: null,
        token: null,
        email: null,
        name: null,
      },
      twitter: {
        id: null,
        token: null,
        email: null,
        name: null,
      },
      token: {
        id: null,
        value: null, // token
        user: null, // user object
        expires: null, // age to expire
        expiresAt: null,
      },
      stripe: {
        id: null,
        email: null,
        name: null,
      },
    };
  }
  get(name) {
    return this[name];
  }
  set(name, value) {
    this[name] = value;
  }
  assign(rows) {
    var _obj = this,
      data = _obj.data,
      key = null,
      keyPair = null;
    for (key in rows[0]) {
      if (key.indexOf(".") > -1) {
        keyPair = key.split(".");
        data[keyPair[0]][keyPair[1]] = rows[0][key];
      } else {
        data.local[key] = rows[0][key];
        if (key === "subscriberid") {
          _obj.data.subscriberid = data.local[key];
        }
        if (key === "id") {
          _obj.data.id = data.local[key];
        }
      }
    }
  }
  parse(keyObject) {
    var key = null,
      obj = null;

    for (key in keyObject) {
      if (key.indexOf(".") === -1) {
        obj = ["", key];
      } else {
        obj = key.split(".");
      }
    }
    return { column: key, auth: obj[0], key: obj[1], value: keyObject[key] };
  }
  extractJSON(result) {
    const aColumns = result.columns;
    var columns = {},
      json = [],
      rows = [],
      sets = result.recordsets;
    if (sets) {
      for (i = 0; i < sets.length; i++) {
        rows = sets[i];
        columns = result.columns[i];
        json[i] = [];
        rows.forEach((row) => {
          var oCol = {};
          row.forEach((col, cIndex) => {
            oCol[columns[cIndex].name] = col;
          });
          json[i].push(JSON.parse(JSON.stringify(oCol)));
        });
      }
    }
    result.json = json;
  }
  generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }
  validPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
  async generateToken(n) {
    var _obj = this,
      newToken = new Token(),
      userToken = _obj.data.token,
      userLocal = _obj.data.local;

    newToken.token.value = randToken.generate(64);
    newToken.token.user = userLocal.id;
    newToken.token.expires = 0;
    newToken.user = _obj;

    try {
      const token = await newToken.save();
      console.log("Newly Created Token", newToken, token);
      if (token) {
        userToken.id = token.data.token.id;
        userToken.value = token.data.token.value;
        userToken.token = token.data.token.value;
        userLocal.token = token.data.token.value;
        userToken.expires = token.data.token.expires;
        userToken.expiresAt = token.data.token.expiresAt;
        userToken.user = token.data.token.user;
        await _obj.saveToken();
      }
      console.log("Token generated: ", _obj.data, newToken.token);
      return token;
    } catch (err) {
      throw err;
    }
  }
  async findById(id) {
    const _obj = this;
    const query = `SELECT TOP 1 * from ${dbSchema}.dbo.swAuthTable WHERE id = @id`;

    const parameters = {
      id: { type: "NVarChar", size: 255, value: id },
    };

    try {
      const response = await MSSQL.execQuery(query, parameters);
      //console.log("User.findById", query, response);
      const rows = response.data;
      // _obj.extractJSON(rows);
      if (rows) {
        _obj.assign(rows);
        return { err: null, data: _obj };
      }
      return {
        err: { statusCode: 404, message: "User not found" },
        data: false,
      };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
  async findOne(keyObject) {
    var _obj = this;
    const search = this.parse(keyObject);
    const query = `SELECT TOP 1 * from ${dbSchema}.dbo.swAuthTable WHERE [@column] = [@value]`;

    const parameters = {
      column: { type: "NVarChar", size: 50, value: search.column },
      value: { type: "NVarChar", size: 4000, value: search.value },
    };

    try {
      const response = await MSSQL.execQuery(query, parameters);
      //console.log("User.findOne", query, response);
      const rows = response.data;
      if (rows) {
        _obj.assign(rows);
        return { err: null, data: _obj };
      }
      return {
        err: { statusCode: 404, message: "User not found" },
        data: false,
      };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
  async findOrCreate(email, password) {
    const _obj = this;
    const query = `SELECT TOP 1 * FROM ${dbSchema}.dbo.swAuthTable WHERE username = @username`;

    const parameters = {
      username: { type: "NVarChar", size: 50, value: search.column },
    };

    try {
      const response = await MSSQL.execQuery(query, parameters);
     // console.log("User.findOrCreate", query, response);
      const rows = response.data;
      if (rows) {
        _obj.assign(rows);
        return { err: null, data: _obj };
      } else {
        const data = _obj.data.local;
        data.username = email;
        data.password = _obj.generateHash(password);
        const insertQuery = `INSERT INTO ${dbSchema}.dbo.swAuthTable( username, password ) VALUES(@email, @password)`;
        parameters = {
          username: { type: "NVarChar", size: 50, value: data.username },
          password: { type: "NVarChar", size: 255, value: data.password },
        };

        try {
          const insResponse = await MSSQL.execQuery(insertQuery, parameters);
        /*  console.log(
            "User.findOrCreate insertQuery",
            insertQuery,
            insResponse
          );
        */
          const rows = insResponse.data;
          if (rows) {
            _obj.assign(rows);
            return { err: null, data: _obj };
          } else {
            const selectQuery = `SELECT id, appid, pageid, subscriberid, [token.value] from ${dbSchema}.dbo.swAuthTable where username = @username`;
            parameters = {
              username: { type: "NVarChar", size: 50, value: data.username },
            };

            try {
              const selResponse = await MSSQL.execQuery(
                selectQuery,
                parameters
              );
              /*
              console.log(
                "User.findOrCreate selectQuery",
                selectQuery,
                selResponse
              );
              */
              const row = insResponse.data;
              if (row) {
                data.id = row.id;
                data.appid = row.appid;
                data.pageid = row.pageid;
                data.subscriberid = row.subscriberid;
                data.token = row["token.value"];
              }
            } catch (err) {
              return { err: err, data: null };
            }
          }
        } catch (err) {
          return { err: err, data: null };
        }
      }
      return {
        err: { statusCode: 404, message: "User not found" },
        data: false,
      };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
  async findAndUpdate(email, password) {
    const _obj = this;
    const query = `SELECT TOP 1 * FROM ${dbSchema}.dbo.swAuthTable WHERE username = @username`;
    const parameters = {
      username: { type: "NVarChar", size: 50, value: email },
    };

    try {
      const response = await MSSQL.execQuery(query, parameters);
      //console.log("User.findAndUpdate", query, response);
      const rows = response.data;
      if (rows) {
        _obj.assign(rows);
        const data = _obj.data.local;
        data.password = _obj.generateHash(password);
        const updateQuery = `UPDATE ${dbSchema}.dbo.swAuthTable SET password = @password WHERE id = @id`;
        parameters = {
          password: { type: "NVarChar", size: 50, value: data.password },
          id: { type: "NVarChar", size: 255, value: data.id },
        };

        try {
          const updResponse = await MSSQL.execQuery(updateQuery, parameters);
          /*
          console.log(
            "User.findAndUpdate updateQuery",
            updateQuery,
            updResponse
          );*/
          return { err: null, data: _obj };
        } catch (err) {
          return { err: err, data: null };
        }
      }
    } catch (err) {
      return { err: err, data: null };
    }
  }
  async create(email, password) {
    var newUser = new User(),
      data = newUser.data.local;
    query =
      `INSERT INTO ${dbSchema}.dbo.swAuthTable(username, password) ` +
      ` OUTPUT Inserted.ID VALUES (@username, @password)`;

    data.username = email;
    data.password = password;

    const parameters = {
      username: { type: "NVarChar", size: 255, value: email },
      password: { type: "NVarChar", size: 255, value: password },
    };

    try {
      const response = await MSSQL.execQuery(query, parameters);
     // console.log("User.create", query, response);
      const row = response.data;
     // console.log("User.create ROW:ID: ", response);
      data.id = row.ID;
      return { err: null, data: rows };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
  async save() {
    const _obj = this;
    const data = _obj.data;
    var query = `UPDATE ${dbSchema}.dbo.swAuthTable SET `;
    var parameters = {};
    var comma = "";
    var value = null;
    var dbKey = "";
    var param = "";

    for (const key in data) {
      if (
        key !== "createdate" &&
        key !== "memberid" &&
        key !== "email" &&
        key !== "subscriberid"
      ) {
        if (data[key] instanceof Object) {
          for (var subKey in data[key]) {
            value = data[key][subKey];
            if (key === "local") {
              if (subKey !== "memberid" && subKey !== "id") {
                query += `${comma} [${subKey}] = @${subKey}`;
                parameters[subKey] = {
                  type: MSSQL.getVarType(value),
                  value: value,
                };
                comma = ", ";
              }
            } else {
              value = data[key][subKey];
              param = key + "_" + subKey;
              dbKey = key + "." + subKey;
              query += `${comma} [${dbKey}] = @${param}`;
              parameters[param] = {
                type: MSSQL.getVarType(value),
                value: value,
              };
              comma = ", ";
            }
          }
        } else {
          if (!parameters[key]) query += `${comma} [${key}] = @${key}`;
          parameters[key] = {
            type: MSSQL.getVarType(data[key]),
            value: data[key],
          };
          comma = ", ";
        }
      }
    }

    query += ` WHERE id = @id`;

    parameters["id"] = {
      type: MSSQL.getVarType(data.local.id),
      value: data.local.id,
    };

    console.log(parameters);
    try {
     // console.log(query);
      const response = await MSSQL.execQuery(query, parameters);
      //console.log("User.save ", response);
      return { err: null, data: _obj };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
  async saveToken() {
    var _obj = this;
    const data = _obj.data;
    const query =
      `UPDATE ${dbSchema}.dbo.swAuthTable set [token.value] = @token, [token.user] = @user, [token.userid] = @user, 
      [token.expires] = @expires, [token.expiresAt] = @expiresAt WHERE id = @id`;

    const parameters = {
      token: { type: "NVarChar", size: 255, value: data.token.value },
      user: { type: "NVarChar", size: 255, value: data.token.user },
      userId: { type: "NVarChar", size: 255, value: data.id },
      expires: { type: "Numeric", value: data.token.expires },
      expiresAt: { type: "DateTime", value: data.token.expiresAt },
      id: { type: "NVarChar", size: 255, value: data.token.id },
    };

    try {
      const response = await MSSQL.execQuery(query, parameters);
     // console.log("User.saveToken", query, response);
      return { err: null, data: _obj };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
  async initializeToken(subscriberId) {
    var _obj = this;
    const data = _obj.data;
    const token = data.token;
    const query =
      `UPDATE ${dbSchema}.dbo.swAuthTable 
      set subscriberid = @subId, token= @token, [token.id] = @id, [token.user] = @user, [token.value] = @value,
      [token.expires] = @expires WHERE id = @userId`;
    _obj.data.subscriberid = subscriberId;

    const parameters = {
      subId: { type: "NVarChar", size: 255, value: subscriberId },
      token: { type: "NVarChar", size: 255, value: data.token.value },
      id: { type: "NVarChar", size: 255, value: token.id },
      user: { type: "NVarChar", size: 255, value: token.user },
      value: { type: "NVarChar", size: 255, value: token.value },
      expires: { type: "Numeric", value: token.expires },
      userId: { type: "NVarChar", size: 255, value: data.id },
    };

    try {
      const response = await MSSQL.execQuery(query, parameters);
     // console.log("User.initializeToken", query, response);
      return { err: null, data: _obj };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
}
async function verify(params, callback) {
  const req = params.req;
  const email = params.email;
  const password = params.password;
  const newUser = params.user;
  //console.log("Custom Verification:", params);
  const query = `SELECT * FROM ${dbSchema}.dbo.swAuthTable WHERE username = @username`;
  const parameters = {
    username: { type: "NVarChar", size: 255, value: email },
  };

  try {
    const response = await MSSQL.execQuery(query, parameters);
    //console.log("User verify", query, parameters, response, newUser.data);
    const row = response.data[0];
    if (response.err) {
      console.log("User verify", query, parameters, response, newUser.data);
      return { err: err, data: null };
    }
    if (!row || Object.keys(row).length === 0) {
      return {
        err: { statusCode: 404, message: "User not found" },
        data: null,
      };
    }
    if (row.accountstatus !== 1) {
      // Check Account Status
      switch (row.accountstatus) {
        case 2:
          return {
            err: { statusCode: 420, message: "Account Suspended" },
            data: null,
          };
        case 3:
          return {
            err: { statusCode: 421, message: "Account Terminated" },
            data: null,
          };
        default:
          return {
            err: { statusCode: 423, message: "Invalid Account Status" },
            data: null,
          };
      }
    }
    var data = newUser.data;
    var local = data.local;
    local.id = data.id = row.id;
    local.username = data.username = row.username;
    local.password = data.password = row.password;
    local.memberid = data.memberid = row.memberid;
    local.subscriberid = data.subscriberid = row.subscriberid;
    local.accesslevel = data.accesslevel = parseInt(row.accesslevel, 10);
    local.rights = data.rights = parseInt(row.rights, 10);
    local.groups = data.groups = parseInt(row.groups, 10);
    local.pageid = data.pageid = row.pageid;
    local.appid = data.appid = row.appid;
    local.token = row["token.value"];
    data.token.id = row["token.id"];
    data.token.user = row["token.user"];
    data.token.userid = row["token.userid"];
    data.token.value = row["token.value"];
    data.token.expires = row["token.expires"];
    data.token.expiresAt = row["token.expiresAt"];
    //console.log("User verify 2: ", data);

    if (!newUser.validPassword(password, data.password)) {
      // Check password
      return {
        err: { statusCode: 424, message: "Oops! Wrong Password" },
        data: null,
      };
    }
    if (!data.token || data.token.value === "" || data.username !== email) {
      await newUser.generateToken(0);
      await newUser.saveToken();
    }

    var newToken = new Token();
    const tokResponse = await newToken.findOne({ token: data.token.value });
    const token = tokResponse.data;
    // console.log("User verify 3: token: ", token);
    if (!token) {
      newUser.generateToken(0);
      const usrResponse = await newUser.saveToken();
      if (usrResponse.data) {
        newUser.token = usrResponse.data.value;
      } else {
        return {
          err: { statusCode: 425, message: "Oops! No Token" },
          data: null,
        };
      }
    }
    return { err: null, data: newUser };
  } catch (err) {
    console.log("VERIFY ERROR: ", err);
    return {
      err: { statusCode: 426, message: "Error! Could Not Generate Token" },
      data: null,
    };
  }
}
module.exports = {
  User,
  verify,
};
