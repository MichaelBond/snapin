const randToken = require("rand-token");
const SQL = require("../routes/snap_sql.js");
const MSSQL = SQL.MSSQL;
const dbSchema = "swpro";

class Token {
  constructor() {
    this.user = null;
    this.lifespan = 20;
    this.token = {
      id: null,
      value: null,
      user: null,
      expires: null,
      expiresAt: null,
    };
  }
  async findOne(keyObject) {
    const now = new Date();
    var tokenDTG = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    tokenDTG = tokenDTG.toISOString().slice(0, 19).replace("T", " ") + ".000";
    const query = `SELECT TOP 1 [id], [value], [user], [expires], [expiresAt] FROM ${dbSchema}.dbo.swAuthTokens 
    WHERE value = @token AND (expires = 0 or expiresAt > convert(DateTime,@dtg))`;
    //console.log(keyObject);
    if (Array.isArray(keyObject.token)) {
      keyObject.token = keyObject.token[0];
    }
    const parameters = {
      token: {
        type: MSSQL.getVarType(keyObject.token),
        value: keyObject.token,
      },
      dtg: { type: MSSQL.getVarType(tokenDTG), value: tokenDTG },
    };

    try {
      MSSQL.isConnected();
      const response = await MSSQL.execQuery(query, parameters);
      if (response.data) {
        const row = response.data[0];
        if (row) {
          var newToken = new Token();
          newToken.token = {
            id: row.id,
            value: row.value,
            user: row.user,
            expires: row.expires,
            expiresAt: row.expiresAt,
          };
          return { err: null, data: newToken };
        }
        //console.log("Token.findOne: ", response);
      }
      //console.log("Token.findOne: No Row", query, response);
      return {
        err: { statusCode: 404, message: "Token Not Found" },
        data: null,
      };
    } catch (err) {
      console.log("Token.findOne: ", query, parameters);
      console.log(err);
      return { err: err, data: false };
    }
  }
  async create(user) {
    const tokenValue = randToken.generate(64);
    const now = new Date();
    var DTG = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const newToken = this;
    const query =
      `INSERT INTO ${dbSchema}.dbo.swAuthTokens( value, [user], expires, expiresAt) ` +
      "VALUES(@token, @user, @expires, @expireAt)";

    tokenDTG.setTime(tokenDTG.getTime() + this.lifespan * 60000);
    tokenDTG = tokenDTG.toISOString().slice(0, 19).replace("T", " ");

    newToken.token.value = tokenValue;
    newToken.token.user = user.data.id;
    newToken.token.expires = 0;
    user.data.local.token = tokenValue;
    user.data.token = JSON.parse(JSON.stringify(newToken.token));
    if (Array.isArray(keyObject.token)) {
      keyObject.token = keyObject.token[0];
    }
    const parameters = {
      token: {
        type: MSSQL.getVarType(keyObject.token),
        value: keyObject.token,
      },
      user: { type: MSSQL.getVarType(user.data.id), value: user.data.id },
      expires: { type: MSSQL.getVarType(0), value: 0 },
      expiresAt: { type: MSSQL.getVarType(tokenDTG), value: tokenDTG },
    };

    try {
      const response = await MSSQL.execQuery(query, parameters);
      //console.log("Token.create: ", query, response);
      return { err: null, data: this };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
  async save() {
    const newToken = this;
    const now = new Date();
    var tokenDTG = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

    const query =
      `INSERT INTO ${dbSchema}.dbo.swAuthTokens( value, [user], expires, expiresAt ) ` +
      " VALUES(@value, @user, @expires, @expiresAt)";

    tokenDTG.setTime(tokenDTG.getTime() + this.lifespan * 60000);
    tokenDTG = tokenDTG.toISOString().slice(0, 19).replace("T", " ");
    const parameters = {
      value: {
        type: MSSQL.getVarType(newToken.token.value),
        value: newToken.token.value,
      },
      user: {
        type: "UniqueIdentifier",
        value: newToken.token.user,
      },
      expires: { type: "Int", value: newToken.token.expires },
      expiresAt: {
        type: MSSQL.getVarType(tokenDTG),
        size: 20,
        value: tokenDTG,
      },
    };
    //console.log(parameters);
    try {
      const response = await MSSQL.execQuery(query, parameters);
      //console.log("Token.save: ", query, response);
      return { err: null, data: this };
    } catch (err) {
      console.log(err);
      return { err: err, data: false };
    }
  }
  async refreshToken(keyObject) {
    const newToken = this;
    const now = new Date();
    var tokenDTG = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const query = `UPDATE ${dbSchema}.dbo.swAuthTokens SET expiresAt = @expiresAt WHERE value = @token`;

    tokenDTG.setTime(tokenDTG.getTime() + this.lifespan * 60000);
    tokenDTG = tokenDTG.toISOString().slice(0, 19).replace("T", " ");
    //console.log(keyObject);
    if (keyObject.value !== undefined) {
      const parameters = {
        token: {
          type: MSSQL.getVarType(keyObject.value),
          value: keyObject.value,
        },
        expiresAt: { type: MSSQL.getVarType(tokenDTG), value: tokenDTG },
      };
      try {
        const response = await MSSQL.execQuery(query, parameters);
        //console.log("Token.refreshToken: ", query, response);

        return { err: null, data: true };
      } catch (err) {
        console.log(err);
        return { err: null, data: false };
      }
    } else {
      return { err: null, data: false };
    }
  }
}

module.exports = Token;
