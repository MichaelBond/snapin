import MSSQLServiceClass from "../services/MSSQLClass";

const MSSQL = new MSSQLServiceClass("SmartWeb")
export const getPageList = async () => {
    return await MSSQL.execQuery("SELECT * from SmartWeb.dbo.swWebPages where WebAppID = 1 order by PageID")
}