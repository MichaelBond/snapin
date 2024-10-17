import bcrypt from 'bcrypt';
import randToken from 'rand-token';
import * as MSSQL from '../controllers/mssqlController'; // Adjust to your MSSQL import
import { Token } from './snapToken'; // Adjust to your Token import

type UserData = {
    id: string | null;
    subscriberid: string | null;
    local: {
        id: string | null;
        username: string | null;
        password: string | null;
        token: string | null;
        appid: string | null;
        pageid: string | null;
        subscriberid: string | null;
    };
    azureAD: Record<string, any>;
    facebook: Record<string, any>;
    google: Record<string, any>;
    linkedin: Record<string, any>;
    twitter: Record<string, any>;
    token: {
        id: string | null;
        value: string | null;
        user: string | null;
        expires: number | null;
        expiresAt: Date | null;
        token: string | null;
    };
    stripe: {
        id: string | null;
        email: string | null;
        name: string | null;
    };
};
const dbSchema = "swpro"

export class User {
    user: any;
    lifespan: number;
    data: UserData;
    private dbSchema: string

    constructor() {
        this.user = null;
        this.lifespan = 20;
        this.dbSchema = dbSchema
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
            facebook: { id: null, token: null, email: null, name: null },
            google: { id: null, token: null, email: null, name: null },
            linkedin: { id: null, token: null, email: null, name: null },
            twitter: { id: null, token: null, email: null, name: null },
            token: {
                id: null,
                value: null,
                user: null,
                expires: null,
                expiresAt: null,
                token: null
            },
            stripe: { id: null, email: null, name: null },
        };
    }

    /**
     * Retrieves the value associated with the given name from the class.
     * 
     * @param name - The property name.
     * @returns - The value of the property.
     */
    get(name: string): any {
        return this[name];
    }

    /**
     * Sets the value for the given property name.
     * 
     * @param name - The property name.
     * @param value - The value to set.
     */
    set(name: string, value: any): void {
        this[name] = value;
    }

    /**
     * Extracts JSON from the database result set.
     * 
     * @param result - The database result set.
     */
    extractJSON(result: any): void {
        const sets = result.recordsets;
        if (sets) {
            result.json = sets.map((rows: any[], i: number) =>
                rows.map((row: any, cIndex: number) => {
                    const columns = result.columns[i];
                    return columns.reduce((oCol: any, col: any, cIndex: number) => {
                        oCol[col.name] = row[cIndex];
                        return oCol;
                    }, {});
                })
            );
        }
    }

    /**
     * Generates a hashed password.
     * 
     * @param password - The plain-text password.
     * @returns - The hashed password.
     */
    private generateHash(password: string): string {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    }

    /**
     * Verifies if the provided password matches the stored hash.
     * 
     * @param password - The plain-text password.
     * @param hash - The stored hash.
     * @returns - Boolean indicating if the password is valid.
     */
    validPassword(password: string, hash: string): boolean {
        return bcrypt.compareSync(password, hash);
    }

    /**
     * Generates a new token for the user and stores it in the database.
     * 
     * @param n - An optional parameter.
     */
    async generateToken(): Promise<any> {
        const newToken = new Token();
        newToken.token.value = randToken.generate(64);
        newToken.token.user = this.data.local.id;
        newToken.token.expires = 0;
        newToken.user = this;

        try {
            const token: any = await newToken.save();
            if (token) {
                const userToken = this.data.token;
                const userLocal = this.data.local;
                userToken.id = token.data.token.id;
                userToken.value = token.data.token.value;
                userToken.token = token.data.token.value;
                userLocal.token = token.data.token.value;
                userToken.expires = token.data.token.expires;
                userToken.expiresAt = token.data.token.expiresAt;
                userToken.user = token.data.token.user;
                await this.saveToken();
            }
            return token;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Finds a user by ID.
     * 
     * @param {string} id - The ID of the user to find.
     * @returns {Promise<{ err: any, data: User | false }>} - The found user or error.
     */
    async findById(id: string): Promise<{ err: any, data: User | false }> {
        const query = `SELECT TOP 1 * from ${this.dbSchema}.dbo.swAuthTable WHERE id = @id`;
        const parameters = {
            id: { type: 'NVarChar', size: 255, value: id },
        };

        try {
            const response = await MSSQL.execQuery(query, parameters);
            const rows = response.data;

            if (rows) {
                this.assign(rows); // Assign the data to the current user object
                return { err: null, data: this };
            }

            return {
                err: { statusCode: 404, message: 'User not found' },
                data: false,
            };
        } catch (err) {
            console.error('Error in findById:', err);
            return { err, data: false };
        }
    }

    /**
     * Finds a user based on a key-value pair.
     * 
     * @param {Record<string, any>} keyObject - The key-value pair to search for (e.g., { username: 'john' }).
     * @returns {Promise<{ err: any, data: User | false }>} - The found user or error.
     */
    async findOne(keyObject: Record<string, any>): Promise<{ err: any, data: User | false }> {
        const search = this.parse(keyObject); // Parse the keyObject to get column and value for the query
        const query = `SELECT TOP 1 * from ${this.dbSchema}.dbo.swAuthTable WHERE [@column] = [@value]`;

        const parameters = {
            column: { type: 'NVarChar', size: 50, value: search.column },
            value: { type: 'NVarChar', size: 4000, value: search.value },
        };

        try {
            const response = await MSSQL.execQuery(query, parameters);
            const rows = response.data;

            if (rows) {
                this.assign(rows); // Assign the found data to this instance
                return { err: null, data: this };
            }

            return {
                err: { statusCode: 404, message: 'User not found' },
                data: false,
            };
        } catch (err) {
            console.error('Error in findOne:', err);
            return { err, data: false };
        }
    }

    /**
     * Assigns the retrieved rows to the user's data structure.
     * 
     * @param {any[]} rows - The data rows retrieved from the database.
     */
    private assign(rows: any): void {
        rows.forEach((row) => {
            Object.keys(row).forEach((key) => {
                if (key.includes('.')) {
                    const [mainKey, subKey] = key.split('.');
                    (this.data as any)[mainKey][subKey] = row[key];
                } else {
                    this.data.local[key] = row[key];
                    if (key === 'subscriberid') this.data.subscriberid = row[key];
                    if (key === 'id') this.data.id = row[key];
                }
            });
        });
    }

    /**
     * Parses the key-value pair to extract the column and value for the SQL query.
     * 
     * @param {Record<string, any>} keyObject - The key-value pair to parse.
     * @returns {{ column: string; auth: string; key: string; value: any }} - Parsed data.
     */
    private parse(keyObject: Record<string, any>): { column: string; auth: string; key: string; value: any } {
        let parsedKey = '';
        let auth = '';

        Object.keys(keyObject).forEach((key) => {
            if (key.includes('.')) {
                [auth, parsedKey] = key.split('.');
            } else {
                auth = '';
                parsedKey = key;
            }
        });

        return {
            column: parsedKey,
            auth,
            key: parsedKey,
            value: keyObject[parsedKey],
        };
    }

    /**
     * Finds a user by their email and password, or creates a new user if not found.
     * 
     * @param {string} email - The user's email (username).
     * @param {string} password - The user's password.
     * @returns {Promise<{ err: any, data: User | false }>} - The found or newly created user or an error.
     */
    async findOrCreate(email: string, password: string): Promise<{ err: any, data: User | false }> {
        const query = `SELECT TOP 1 * FROM ${this.dbSchema}.dbo.swAuthTable WHERE username = @username`;
        let parameters: any = {
            username: { type: 'NVarChar', size: 50, value: email },
        };

        try {
            // Try to find an existing user by email (username)
            const response = await MSSQL.execQuery(query, parameters);
            const rows = response.data;

            if (rows && rows.length > 0) {
                // If user exists, assign the data to this instance and return it
                this.assign(rows);
                return { err: null, data: this };
            } else {
                // User not found, create a new one
                const data: any = this.data.local;
                data.username = email;
                data.password = this.generateHash(password);

                const insertQuery = `INSERT INTO ${this.dbSchema}.dbo.swAuthTable (username, password) VALUES (@username, @password)`;
                parameters = {
                    username: { type: 'NVarChar', size: 50, value: data.username },
                    password: { type: 'NVarChar', size: 255, value: data.password },
                };

                try {
                    const insResponse = await MSSQL.execQuery(insertQuery, parameters);
                    const rows = insResponse.data;

                    if (rows && rows.length > 0) {
                        // Assign newly created user data to this instance
                        this.assign(rows);
                        return { err: null, data: this };
                    } else {
                        // After inserting, fetch the newly created user's data
                        const selectQuery = `SELECT id, appid, pageid, subscriberid, [token.value] FROM ${this.dbSchema}.dbo.swAuthTable WHERE username = @username`;
                        parameters = {
                            username: { type: 'NVarChar', size: 50, value: data.username },
                        };

                        try {
                            const selResponse = await MSSQL.execQuery(selectQuery, parameters);
                            const row = selResponse.data;

                            if (row) {
                                data.id = row.id;
                                data.appid = row.appid;
                                data.pageid = row.pageid;
                                data.subscriberid = row.subscriberid;
                                data.token = row['token.value'];
                            }

                            return { err: null, data: this };
                        } catch (err) {
                            return { err: err, data: data };
                        }
                    }
                } catch (err) {
                    return { err: err, data: data };
                }
            }
        } catch (err) {
            return { err, data: false };
        }
    }

    /**
     * Finds a user by their email (username) and updates their password.
     * 
     * @param {string} email - The user's email (username).
     * @param {string} password - The new password to set.
     * @returns {Promise<{ err: any, data: User | null }>} - The updated user or an error.
     */
    async findAndUpdate(email: string, password: string): Promise<{ err: any, data: User | null }> {
        const query = `SELECT TOP 1 * FROM ${this.dbSchema}.dbo.swAuthTable WHERE username = @username`;
        const parameters = {
            username: { type: 'NVarChar', size: 50, value: email },
        };

        try {
            // Find user by email (username)
            const response = await MSSQL.execQuery(query, parameters);
            const rows = response.data;

            if (rows && rows.length > 0) {
                // Assign user data to this instance
                this.assign(rows);
                const data = this.data.local;

                // Hash the new password and update it in the database
                data.password = this.generateHash(password);
                const updateQuery = `UPDATE ${this.dbSchema}.dbo.swAuthTable SET password = @password WHERE id = @id`;
                const updateParameters = {
                    password: { type: 'NVarChar', size: 255, value: data.password },
                    id: { type: 'NVarChar', size: 255, value: data.id },
                };

                try {
                    await MSSQL.execQuery(updateQuery, updateParameters);
                    return { err: null, data: this };
                } catch (err) {
                    return { err: err, data: null };
                }
            }

            // If user is not found, return an error
            return { err: { statusCode: 404, message: 'User not found' }, data: null };
        } catch (err) {
            return { err, data: null };
        }
    }
    /**
     * Creates a new user and inserts them into the database.
     * 
     * @param {string} email - The user's email (username).
     * @param {string} password - The user's password.
     * @returns {Promise<{ err: any, data: User | false }>} - The newly created user or an error.
     */
    async create(email: string, password: string): Promise<{ err: any, data: User | false }> {
        const newUser = new User();
        const data = newUser.data.local;

        const query = `INSERT INTO ${this.dbSchema}.dbo.swAuthTable(username, password) OUTPUT Inserted.ID VALUES (@username, @password)`;

        data.username = email;
        data.password = password;

        const parameters = {
            username: { type: 'NVarChar', size: 255, value: email },
            password: { type: 'NVarChar', size: 255, value: password },
        };

        try {
            const response = await MSSQL.execQuery(query, parameters);
            const row = response.data;

            if (row && row.ID) {
                data.id = row.ID; // Assign the generated ID to the user data
                return { err: null, data: newUser };
            }

            return { err: { statusCode: 500, message: 'Error creating user' }, data: false };
        } catch (err) {
            console.error('Error in create:', err);
            return { err: err, data: false };
        }
    }

    /**
     * Saves the user's data by updating the record in the database.
     * 
     * @returns {Promise<{ err: any, data: User | false }>} - The updated user or an error.
     */
    async save(): Promise<{ err: any, data: User | false }> {
        const data = this.data;
        let query = `UPDATE ${this.dbSchema}.dbo.swAuthTable SET `;
        const parameters: Record<string, any> = {};
        let comma = '';

        for (const key in data) {
            if (key !== 'createdate' && key !== 'memberid' && key !== 'email' && key !== 'subscriberid') {
                if (typeof data[key] === 'object') {
                    for (const subKey in data[key]) {
                        const value = data[key][subKey];
                        if (key === 'local' && subKey !== 'memberid' && subKey !== 'id') {
                            query += `${comma} [${subKey}] = @${subKey}`;
                            parameters[subKey] = {
                                type: MSSQL.getVarType(value),
                                value: value,
                            };
                            comma = ', ';
                        } else {
                            const param = `${key}_${subKey}`;
                            const dbKey = `${key}.${subKey}`;
                            query += `${comma} [${dbKey}] = @${param}`;
                            parameters[param] = {
                                type: MSSQL.getVarType(value),
                                value: value,
                            };
                            comma = ', ';
                        }
                    }
                } else {
                    if (!parameters[key]) {
                        query += `${comma} [${key}] = @${key}`;
                        parameters[key] = {
                            type: MSSQL.getVarType(data[key]),
                            value: data[key],
                        };
                        comma = ', ';
                    }
                }
            }
        }

        query += ` WHERE id = @id`;
        parameters['id'] = {
            type: MSSQL.getVarType(data.local.id),
            value: data.local.id,
        };

        try {
            const response = await MSSQL.execQuery(query, parameters);
            return { err: null, data: this };
        } catch (err) {
            console.error('Error in save:', err);
            return { err: err, data: false };
        }
    }

    /**
     * Saves the user's token data into the database.
     * 
     * @returns {Promise<{ err: any, data: User | false }>} - The user with updated token or an error.
     */
    async saveToken(): Promise<{ err: any, data: User | false }> {
        const data = this.data;

        const query = `UPDATE ${dbSchema}.dbo.swAuthTable SET [token.value] = @token, [token.user] = @user, [token.userid] = @user, [token.expires] = @expires, [token.expiresAt] = @expiresAt WHERE id = @id`;

        const parameters = {
            token: { type: 'NVarChar', size: 255, value: data.token.value },
            user: { type: 'NVarChar', size: 255, value: data.token.user },
            userId: { type: 'NVarChar', size: 255, value: data.id },
            expires: { type: 'Numeric', value: data.token.expires },
            expiresAt: { type: 'DateTime', value: data.token.expiresAt },
            id: { type: 'NVarChar', size: 255, value: data.token.id },
        };

        try {
            const response = await MSSQL.execQuery(query, parameters);
            return { err: null, data: this };
        } catch (err) {
            console.error('Error in saveToken:', err);
            return { err: err, data: false };
        }
    }

    /**
     * Initializes the user's token with a given subscriber ID and saves it to the database.
     * 
     * @param {string} subscriberId - The subscriber ID to associate with the user.
     * @returns {Promise<{ err: any, data: User | false }>} - The updated user or an error.
     */
    async initializeToken(subscriberId: string): Promise<{ err: any, data: User | false }> {
        const data = this.data;
        const token = data.token;

        const query = `UPDATE ${dbSchema}.dbo.swAuthTable SET subscriberid = @subId, token = @token, [token.id] = @id, [token.user] = @user, [token.value] = @value, [token.expires] = @expires WHERE id = @userId`;

        const parameters = {
            subId: { type: 'NVarChar', size: 255, value: subscriberId },
            token: { type: 'NVarChar', size: 255, value: data.token.value },
            id: { type: 'NVarVar', size: 255, value: token.id },
            user: { type: 'NVarChar', size: 255, value: token.user },
            value: { type: 'NVarChar', size: 255, value: token.value },
            expires: { type: 'Numeric', value: token.expires },
            userId: { type: 'NVarChar', size: 255, value: data.id },
        };

        try {
            const response = await MSSQL.execQuery(query, parameters);
            return { err: null, data: this };
        } catch (err) {
            console.error('Error in initializeToken:', err);
            return { err: err, data: false };
        }
    }
}


// The verify function follows the same logic
export async function verify(params: any, callback: any): Promise<any> {
    const { email, password, user: newUser } = params;
    const query = `SELECT * FROM ${dbSchema}.dbo.swAuthTable WHERE username = @username`;
    const parameters = {
        username: { type: 'NVarChar', size: 255, value: email },
    };

    try {
        const response = await MSSQL.execQuery(query, parameters);
        const rows: any = response.data;

        if (!rows) {
            return { err: { statusCode: 404, message: 'User not found' }, data: null };
        }
        const row = rows[0];
        if (!newUser.validPassword(password, row.password)) {
            return { err: { statusCode: 424, message: 'Oops! Wrong Password' }, data: null };
        }

        // Token verification and generation
        if (!row['token.value']) {
            await newUser.generateToken();
            await newUser.saveToken();
        }

        const newToken = new Token();
        const tokResponse = await newToken.findOne({ token: row['token.value'] });
        if (!tokResponse.data) {
            await newUser.generateToken();
            await newUser.saveToken();
        }

        return { err: null, data: newUser };
    } catch (err) {
        return { err: { statusCode: 426, message: 'Error! Could Not Generate Token' }, data: null };
    }
}
