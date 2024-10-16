import randToken from 'rand-token'; // Assuming rand-token is used for token generation
import logger from '../utils/logger';
import * as MSSQL from '../controllers/mssqlController'; // Adjust to your MSSQL import

export class Token {
  user: any;
  lifespan: number;
  dbSchema: string;
  token: {
    id: string | null;
    value: string | null;
    user: string | null;
    expires: number | null;
    expiresAt: string | null;
  };

  constructor() {
    // Initialize the token structure
    this.user = null;
    this.dbSchema = "swpro"
    this.lifespan = 20; // Lifespan in minutes
    this.token = {
      id: null,
      value: null,
      user: null,
      expires: null,
      expiresAt: null,
    };
  }

  /**
   * Finds a token based on a key-value pair.
   * 
   * @param {Record<string, any>} keyObject - The key object to search for a token.
   * @returns {Promise<{ err: any, data: Token | null | false }>} - The found token or an error.
   */
  async findOne(keyObject: Record<string, any>): Promise<{ err: any, data: Token | null | false }> {
    const now = new Date();
    let setTokenDTG = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    let tokenDTG = setTokenDTG.toISOString().slice(0, 19).replace('T', ' ') + '.000';

    const query = `SELECT TOP 1 [id], [value], [user], [expires], [expiresAt] 
    FROM ${this.dbSchema}.dbo.swAuthTokens 
    WHERE value = @token AND (expires = 0 or expiresAt > convert(DateTime,@dtg))`;

    if (Array.isArray(keyObject.token)) {
      keyObject.token = keyObject.token[0]; // Use the first token in the array
    }

    const parameters = {
      token: {
        type: MSSQL.getVarType(keyObject.token),
        value: keyObject.token,
      },
      dtg: { type: MSSQL.getVarType(tokenDTG), value: tokenDTG },
    };

    try {
      // await MSSQL.isConnected(); // Ensure the database is connected
      const response = await MSSQL.execQuery(query, parameters);
      if (response.data) {
        const rows = response.data;
        const row: any = rows[0];
        if (row) {
          const newToken = new Token();
          newToken.token = {
            id: row.id,
            value: row.value,
            user: row.user,
            expires: row.expires,
            expiresAt: row.expiresAt,
          };
          return { err: null, data: newToken };
        }
      }
      return {
        err: { statusCode: 404, message: 'Token Not Found' },
        data: null,
      };
    } catch (err) {
      logger.error('Token.findOne:', query, parameters, err);
      return { err, data: false };
    }
  }

  /**
   * Creates a new token for the user.
   * 
   * @param {any} user - The user object for whom the token is being created.
   * @returns {Promise<{ err: any, data: Token | false }>} - The newly created token or an error.
   */
  async create(user: any): Promise<{ err: any, data: Token | false }> {
    const tokenValue = randToken.generate(64);
    const now = new Date();
    let setTokenDTG = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

    const query = `INSERT INTO ${this.dbSchema}.dbo.swAuthTokens( value, [user], expires, expiresAt) VALUES(@token, @user, @expires, @expireAt)`;

    setTokenDTG.setTime(setTokenDTG.getTime() + this.lifespan * 60000); // Add lifespan to expiration time
    const tokenDTG = setTokenDTG.toISOString().slice(0, 19).replace('T', ' ');

    const newToken = this;
    newToken.token.value = tokenValue;
    newToken.token.user = user.data.id;
    newToken.token.expires = 0;

    user.data.local.token = tokenValue;
    user.data.token = { ...newToken.token };

    const parameters = {
      token: { type: 'NVarChar', size: 255, value: newToken.token.value },
      user: { type: 'UniqueIdentifier', value: newToken.token.user },
      expires: { type: 'Int', value: newToken.token.expires },
      expireAt: { type: MSSQL.getVarType(tokenDTG), value: tokenDTG },
    };

    try {
      await MSSQL.execQuery(query, parameters);
      return { err: null, data: this };
    } catch (err) {
      logger.error('Error in Token.create:', err);
      return { err, data: false };
    }
  }

  /**
   * Saves the token into the database.
   * 
   * @returns {Promise<{ err: any, data: Token | false }>} - The saved token or an error.
   */
  async save(): Promise<{ err: any, data: Token | false }> {
    const newToken = this;
    const now = new Date();
    let setTokenDTG = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

    const query = `INSERT INTO ${this.dbSchema}.dbo.swAuthTokens( value, [user], expires, expiresAt ) VALUES(@value, @user, @expires, @expiresAt)`;

    setTokenDTG.setTime(setTokenDTG.getTime() + this.lifespan * 60000); // Add lifespan to expiration time
    const tokenDTG = setTokenDTG.toISOString().slice(0, 19).replace('T', ' ');

    const parameters = {
      value: { type: MSSQL.getVarType(newToken.token.value), value: newToken.token.value },
      user: { type: 'UniqueIdentifier', value: newToken.token.user },
      expires: { type: 'Int', value: newToken.token.expires },
      expiresAt: { type: MSSQL.getVarType(tokenDTG), value: tokenDTG },
    };

    try {
      await MSSQL.execQuery(query, parameters);
      return { err: null, data: this };
    } catch (err) {
      console.error('Error in Token.save:', err);
      return { err, data: this };
    }
  }

  /**
   * Refreshes an existing token by updating its expiration date.
   * 
   * @param {Record<string, any>} keyObject - The key object that contains the token to be refreshed.
   * @returns {Promise<{ err: any, data: boolean | false }>} - Whether the token was successfully refreshed or not.
   */
  async refreshToken(keyObject: Record<string, any>): Promise<{ err: any, data: boolean | false }> {
    const now = new Date();
    let setTokenDTG = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

    const query = `UPDATE ${this.dbSchema}.dbo.swAuthTokens SET expiresAt = @expiresAt WHERE value = @token`;

    setTokenDTG.setTime(setTokenDTG.getTime() + this.lifespan * 60000); // Add lifespan to expiration time
    const tokenDTG = setTokenDTG.toISOString().slice(0, 19).replace('T', ' ');

    if (keyObject.value !== undefined) {
      const parameters = {
        token: { type: MSSQL.getVarType(keyObject.value), value: keyObject.value },
        expiresAt: { type: MSSQL.getVarType(tokenDTG), value: tokenDTG },
      };

      try {
        await MSSQL.execQuery(query, parameters);
        return { err: null, data: true };
      } catch (err) {
        console.error('Error in Token.refreshToken:', err);
        return { err, data: false };
      }
    }

    return { err: null, data: false };
  }
}
