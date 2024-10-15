import MYSQLServiceClass from "../services/MYSQLClass";

const MYSQL = new MYSQLServiceClass("SmartWeb")
export const getLeadInfo = async () => {
    return await MYSQL.execQuery(`SELECT l.fName, l.lName, l.email, l.phone, l.city, l.state, l.zip, l.address_line_1, l.address_line_2, l.timezone, l.latitude, l.longitude, l.statusID, s.name FROM zepcrm.leads as l
INNER JOIN zepcrm.status as s ON s.sid = l.statusID where lid = '3mKQ71tw3aRP'`)
}
export const getQuery = async ( content: { query: string, parameters?: any}) => {
    return await MYSQL.execQuery(content.query, content.parameters)
}