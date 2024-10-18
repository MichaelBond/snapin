import logger from '../utils/logger'

const blockedIps = [
    "192.168.1.1",
    "10.0.2.139",
    "10.0.15.43",
    "149.36.51.12",
    "184.168.120.241",
];

export default (req, res, next) => {
    const ip: any = req.ip;
    const address: any = req.socket.remoteAddress;
    if (blockedIps.includes(ip) || blockedIps.includes(address)) {
        logger.info(`Ip blocked: ${ip} : ${address}`);
        res.status(403).send("Access denied - IP Blocked");
    } else {
        next();
    }
}