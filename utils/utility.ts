
const default_uuid = "C80E6FFC-910A-4C8F-9B90-C393178EA8F0"  // move to configs
type Column = {
    index: number;
    name: string;
    length: number;
    type: string;
    prec: number;
};

type SmartObject = {
    colCount?: number;
    compress: boolean;
    size: number;
    minSize: number;
    rowCount?: number;
    columns?: Column[];
    records?: any;
    type?: string;
    recordCount?: number;
    message?: string;
    layout?: string;
    format?: string;
};

module.exports = {
    /**
     * Retrieves the subscriber ID from the request object, or uses a default UUID if not available.
     * 
     * @param {Request} req - The request object, which may or may not contain user data.
     * @returns {string} - The subscriber ID wrapped in single quotes, or the default UUID if no subscriber ID is found.
     */
    getSubscriber: (req: Request): string => {
        // This will be handled by file ../middleware/userDataCapture

        // Ensure req.user and req.user.data are defined, otherwise use the default UUID.
        const subscriberId = req?.user?.data?.subscriberid || default_uuid;

        // Return the subscriber ID wrapped in single quotes.
        return `'${subscriberId}'`;
    },
    /**
     * Converts a byte array to a formatted hexadecimal string.
     * Each byte is converted to its hexadecimal representation, and a newline is inserted after every 16 bytes.
     * 
     * @param {number[]} byteArr - An array of bytes to be converted to hex.
     * @returns {string | false} - A formatted hexadecimal string, or false if input is invalid.
     */
    convertToFormattedHex: (byteArr: number[]): string | false => {
        let hexStr = "";
        let tmpHex: string;

        // Ensure the input is a valid array of numbers
        if (!Array.isArray(byteArr)) {
            return false;
        }

        // Loop through each byte in the array
        byteArr.forEach((byte, index) => {
            // Handle negative values by adjusting the byte value to be within 0-255
            if (byte < 0) {
                byte = byte + 256;
            }

            // Convert the byte to hexadecimal string
            tmpHex = byte.toString(16);

            // Add leading zero if the hex value is a single character
            tmpHex = tmpHex.length === 1 ? "0" + tmpHex : tmpHex;

            // Insert a newline after every 16 bytes, otherwise add a space
            tmpHex = (index + 1) % 16 === 0 ? tmpHex + "\n" : tmpHex + " ";

            // Append the hex value to the final hex string
            hexStr += tmpHex;
        });

        // Trim any extra spaces or newlines and return the result
        return hexStr.trim();
    },
    /**
     * Converts a formatted hexadecimal string back into a byte array.
     * The function removes any spaces or newlines, and converts the hex string back into bytes.
     * 
     * @param {string} hexStr - A formatted hexadecimal string.
     * @returns {number[] | false} - A byte array, or false if input contains invalid characters.
     */
    convertFormattedHexToBytes: (hexStr: string): number[] | false => {
        const hexData: number[] = [];
        let count = 0;

        // Return an empty array if the input string is empty
        if (hexStr.trim() === "") {
            return [];
        }

        // Validate the hex string: it should only contain hex characters (0-9, a-f, A-F) and whitespace
        if (/[^0-9a-fA-F\s]/.test(hexStr)) {
            return false;
        }

        // Split the string into an array of hex values
        const hexArr = hexStr.split(/([0-9a-fA-F]+)/g);

        // Loop through the hex array and convert each hex value back into a byte
        hexArr.forEach((hex) => {
            if (hex.trim() !== "") {
                hexData[count++] = parseInt(hex, 16);
            }
        });

        // Return the array of bytes
        return hexData;
    },
    /**
     * Converts a JavaScript Date object into a SQL-compatible date string format (YYYY-MM-DD HH:MM:SS).
     * This function uses UTC values to ensure the date is correctly interpreted regardless of time zone.
     * 
     * @param {Date} jsDate - The JavaScript Date object to convert.
     * @returns {string} - The formatted SQL date string in the format 'YYYY-MM-DD HH:MM:SS'.
     */
    jsToSqlDate: (jsDate: Date): string => {
        /**
         * Pads a single-digit number with a leading zero for consistent two-digit formatting.
         * 
         * @param {number} number - The number to pad (e.g., month, day, hour).
         * @returns {string} - The padded number as a string.
         */
        const pad = (number: number): string => (number < 10 ? "0" + number : number.toString());

        // Return formatted SQL date string
        return `${jsDate.getUTCFullYear()}-${pad(jsDate.getUTCMonth() + 1)}-${pad(jsDate.getUTCDate())} ${pad(jsDate.getUTCHours())}:${pad(jsDate.getUTCMinutes())}:${pad(jsDate.getUTCSeconds())}`;
    },
    /**
     * Converts a SQL date string (in the format 'YYYY-MM-DD HH:MM:SS.MS') to a JavaScript Date object.
     * If the input is already a Date object, it returns the same Date object.
     * 
     * @param {string | Date} sqlDate - The SQL date string or Date object to be converted.
     * @returns {Date | null} - A JavaScript Date object, or null if the input is invalid.
     */
    sqlToJsDate: (sqlDate: string | Date): Date | null => {
        let oDate: Date | null = null;

        // Check if sqlDate is already a Date object, return it directly
        if (sqlDate instanceof Date) {
            oDate = sqlDate;
        } else {
            try {
                // Split the SQL date string into components
                const sqlDateArr1 = sqlDate.split("-");
                const sYear = sqlDateArr1[0]; // Year
                const sMonth = (Number(sqlDateArr1[1]) - 1).toString(); // Month (adjusted to 0-based index for JS Date)

                const sqlDateArr2 = sqlDateArr1[2].split(" ");
                const sDay = sqlDateArr2[0]; // Day

                const sqlDateArr3 = sqlDateArr2[1].split(":");
                const sHour = sqlDateArr3[0]; // Hour
                const sMinute = sqlDateArr3[1]; // Minute

                const sqlDateArr4 = sqlDateArr3[2].split(".");
                const sSecond = sqlDateArr4[0]; // Second
                const sMillisecond = sqlDateArr4.length > 1 ? sqlDateArr4[1] : "000"; // Millisecond (optional)

                // Construct the JavaScript Date object using extracted components
                oDate = new Date(
                    parseInt(sYear),
                    parseInt(sMonth),
                    parseInt(sDay),
                    parseInt(sHour),
                    parseInt(sMinute),
                    parseInt(sSecond),
                    parseInt(sMillisecond)
                );
            } catch (error) {
                console.error("Invalid SQL date format", error);
                return null; // Return null if an error occurs
            }
        }

        return oDate;
    },

    /**
     * Formats the given data into a table structure with column metadata.
     * 
     * @param {any} data - The data to format.
     * @returns {SmartObject} - The formatted table object.
     */
    formatTable: function (data: any): SmartObject {
        const smart: SmartObject = { compress: false, size: 0, minSize: 0 };
        const columns: Column[] = [];
        const rows: any[] = [];
        let c = 0;

        try {
            // Process columns
            for (const column in data.columns) {
                c++;
                columns.push({
                    index: data.columns[column].index,
                    name: column,
                    length: data.columns[column].length,
                    type: data.columns[column].type.declaration,
                    prec: data.columns[column].precision,
                });
            }
        } catch (err) {
            throw new Error("Error in formatTable loading columns: " + err);
        }

        try {
            // Set column and row metadata
            smart.colCount = c + 1;
            smart.rowCount = data.length;
            smart.columns = columns;

            // Process rows
            for (let r = 0; r < data.length; r++) {
                const row: any[] = [];
                const record = data[r];
                for (const col in record) {
                    row.push(record[col] === null ? 0 : record[col]);
                }
                rows.push(row);
            }

            smart.type = "table";
            smart.records = rows;
            smart.size = rows.toString().length + smart.columns.toString().length;
            smart.minSize = smart.size;
        } catch (err) {
            throw new Error("Error in formatTable loading rows: " + err);
        }

        return smart;
    },

    /**
     * Formats the data array into an object structure with column metadata.
     * 
     * @param {any[]} dataarray - The data array to format.
     * @returns {SmartObject} - The formatted object structure.
     */
    formatObject: function (dataArray: any[]): SmartObject {
        const smart: SmartObject = { compress: false, size: 0, minSize: 0 };
        const columns: Column[] = [];
        const rows: any[] = [];
        let c = 0;

        try {
            // Process columns
            const dataColumns = dataArray[0];
            for (const column in dataColumns) {
                c++;
                columns.push({
                    index: c,
                    name: column,
                    length: dataColumns[column]?.length ?? 0,
                    type: typeof dataColumns[column],
                    prec: 0,
                });
            }
        } catch (err) {
            throw new Error("Error in formatObject loading columns: " + err);
        }

        try {
            // Set column and row metadata
            smart.colCount = c + 1;
            smart.rowCount = dataArray.length;
            smart.columns = columns;

            // Process rows
            for (let r = 0; r < dataArray.length; r++) {
                const row: any[] = [];
                const record = dataArray[r];
                for (const col in record) {
                    row.push(record[col] === null ? 0 : record[col]);
                }
                rows.push(row);
            }

            smart.type = "table";
            smart.records = rows;
            smart.size = rows.toString().length + smart.columns.toString().length;
            smart.minSize = smart.size;
        } catch (err) {
            throw new Error("Error in formatObject loading rows: " + err);
        }

        return smart;
    },

    /**
     * Formats the result set into a grid structure.
     * 
     * @param {any} results - The result set to format.
     * @returns {SmartObject} - The formatted grid structure.
     */
    formatGrid: function (results: any): SmartObject {
        const smart: SmartObject = { compress: false, size: 0, minSize: 0 };
        let columns: Column[] = [];
        let rText = "";

        try {
            const data = results.recordsets[0];

            // Process columns
            if (data && data[0]) {
                const sysColumns = results.columns[0];
                sysColumns.forEach((item: any, index: number) => {
                    columns.push({
                        index: item.index,
                        name: item.name,
                        length: item.length || 17,
                        type: item.type?.declaration || "numeric",
                        prec: item.precision || 0,
                    });
                });

                // Process rows
                rText += "[[0," + JSON.stringify(columns) + "],";
                data.forEach((row: any, index: number) => {
                    rText += "[" + (index + 1).toString() + ",[" + Object.values(row).join(",") + "]]";
                });
                rText += "]";

                // Set metadata
                smart.recordCount = data.length;
                smart.records = encodeURIComponent(rText);
                smart.size = rText.length;
                smart.minSize = smart.size;
                smart.type = "grid";
            }
        } catch (err) {
            throw new Error("Error in formatGrid: " + err);
        }

        return smart;
    },

    // The remaining methods follow the same structure, adjusted for their specific formatting needs...

    /**
     * Formats the data into a JSON/XML structure.
     * 
     * @param {string} data - The data to format.
     * @returns {SmartObject} - The formatted structure.
     */
    formatJsonXml: function (data: string): SmartObject {
        return {
            type: "xml",
            compress: false,
            size: data.length,
            minSize: data.length,
            records: data,
        };
    },

    /**
     * Formats a message layout from the provided data.
     * 
     * @param {any} data - The message data to format.
     * @returns {SmartObject} - The formatted message layout.
     */
    formatMessage: function (data: any): SmartObject {
        return {
            layout: "message",
            compress: false,
            size: data.length,
            minSize: data.length,
            message: data[0],
            records: { message: data },
        };
    },

    /**
     * Routes the provided result set to the appropriate formatting method.
     * 
     * @param {any} pobject - The parameters to control the formatting.
     * @param {any} results - The result set to be formatted.
     * @returns {SmartObject} - The formatted structure.
     */
    route: function (pObject: any, results: any): SmartObject {
        const format = pObject.format?.toLowerCase() || "rows";
        const layout = pObject.layout?.toLowerCase() || "rows";
        let smart: SmartObject = {
            compress: false,
            size: layout.length,
            minSize: layout.length,
            format: format,
            layout: layout,
            records: null,
        };

        try {
            if (typeof results !== "undefined") {
                switch (layout) {
                    case "table":
                        smart = this.formatTable(results);
                        break;
                    case "grid":
                        smart = this.formatGrid(results);
                        break;
                    case "object":
                        smart = this.formatObject(results);
                        break;
                    case "message":
                        smart = this.formatMessage(results);
                        break;
                    case "xml":
                        smart = this.formatJsonXml(results.recordsets[0]);
                        break;
                    default:
                        smart.records = results.recordsets[0];
                }
            } else {
                smart.layout = "error";
                smart.records = pObject; // handle no response values
            }
        } catch (err) {
            throw new Error("Error in format: " + JSON.stringify(err));
        }

        return smart;
    }
}      
