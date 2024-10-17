import logger from '../utils/logger'
import MSSQLServiceClass from "../services/MSSQLClass";

const MSSQL = new MSSQLServiceClass("SmartWeb")

// delete when done 
export const bryceSeeAllDbs = async () => {
    return await MSSQL.execQuery(`SELECT name FROM sys.databases`)

}
export const getPageList = async () => {
    return await MSSQL.execQuery("SELECT * from SmartWeb.dbo.swWebPages where WebAppID = 1 order by PageID")
}
export const getCube = async (content: { cubeId: number }) => {
    return await MSSQL.getCubeQuery(content);
}
export const getCubeData = async (content: { cubeId: number }) => {
    const response = await MSSQL.getCubeQuery(content);
    return await MSSQL.execQuery(response.data);
}
export const runPython = async (content: { cubeId: number }) => {
    const response = await MSSQL.getCubeQuery(content)
    const pythonCode = response.data
    if (pythonCode.err) {
        return { err: pythonCode.err, data: pythonCode.data };
    }

    const exec = require("child_process").exec;
    // Construct the command to run Python code as text
    logger.info("PYTHON: ", pythonCode);
    const cmd = `python3 -c "${pythonCode.data}"`;
    const process = exec(cmd, function (err: any, stdout: any, stderr: any) {
        if (err) {
            console.error(err);
            return { err: err, data: err.message };
        }
        if (stderr) {
            console.log(stderr);
        } else {
            let result = stdout.toString();
            console.log("STDOUT: ", result);
            return { err: null, data: result }
        }
    });
}