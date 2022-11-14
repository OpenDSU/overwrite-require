const envTypes = require("./moduleConstants");
const originalConsole = Object.assign({}, console);
if ($$.environmentType === envTypes.NODEJS_ENVIRONMENT_TYPE) {
    const logger = new Logger("Logger", "overwrite-require");
    Object.assign(console, logger);
}

function Logger(className, moduleName, logFile) {
    if (typeof className === "undefined" || typeof moduleName === "undefined") {
        throw Error(`Arguments className and moduleName are mandatory.`);
    }

    const MAX_STRING_LENGTH = 11;
    const IS_DEV_MODE = process.env.DEV === "true";
    const getPaddingForArg = (arg, maxLen = MAX_STRING_LENGTH) => {
        let noSpaces = Math.abs(maxLen - arg.length);
        let spaces = String(" ").repeat(noSpaces);
        return spaces;
    };

    const normalizeArg = (arg) => {
        if (arg.length >= MAX_STRING_LENGTH) {
            return arg.substring(0, MAX_STRING_LENGTH);
        } else {
            return `${arg}${getPaddingForArg(arg)}`;
        }
    }

    const convertIntToHexString = (number) => {
        let hexString = number.toString("16");
        let paddingLength = (2 - hexString.length) >= 0 ? (2 - hexString.length) : 0;
        for (let i = 0; i < paddingLength; i++) {
            hexString = "0" + hexString;
        }
        return "0x" + hexString;
    }

    const createLogObject = (functionName, code = 0, ...args) => {
        const crypto = require("opendsu").loadAPI("crypto");
        let message = "";
        for (let i = 0; i < args.length; i++) {
            message += args[i] + " ";
        }

        message.trimEnd();
        const logObject = {
            severity: functionName.toUpperCase(),
            timestamp: new Date().toISOString(),
            eventTypeId: convertIntToHexString(code),
            transactionId: crypto.generateRandom(32).toString("hex"),
            message
        }
        return logObject;
    }

    const getLogStringFromObject = (logObject, appendEOL = false) => {
        let logString = JSON.stringify(logObject);
        if (IS_DEV_MODE) {
            logObject.message = logObject.message.replaceAll("\n", "\n\t");
            logString = `${logObject.severity}${getPaddingForArg(logObject.severity, 9)}${logObject.eventTypeId} ${logObject.timestamp} ${logObject.transactionId} ${logObject.message}`;
            if (appendEOL) {
                logString += require("os").EOL;
            }
        }

        return logString;
    }

    const getLogAsString = (functionName, appendEOL = false, ...args) => {
        const res = stripCodeFromArgs(...args);
        let logObject = createLogObject(functionName, res.code, ...res.args);
        let logString = getLogStringFromObject(logObject, appendEOL);
        return logString;
    }

    const stripCodeFromArgs = (...args) => {
        let code = args[0];
        if (typeof code !== "number") {
            code = 0;
        } else {
            args.shift();
        }

        return {
            code,
            args
        }
    }

    const executeFunctionFromConsole = (functionName, ...args) => {
        if (functionName === "critical") {
            functionName = "error";
        }
        const log = getLogAsString(functionName, false, ...args);
        originalConsole[functionName](log);
    }

    const writeToFile = (functionName, ...args) => {
        const fs = require("fs");
        const path = require("path");
        if (typeof logFile === "undefined") {
            return;
        }

        let log = getLogAsString(functionName, true, ...args);
        try {
            fs.accessSync(path.dirname(logFile));
        } catch (e) {
            fs.mkdirSync(path.dirname(logFile), {recursive: true});
        }

        fs.appendFileSync(logFile, log);
    }

    const printToConsoleAndFile = (functionName, ...args) => {
        executeFunctionFromConsole(functionName, ...args);
        if ($$.environmentType === envTypes.NODEJS_ENVIRONMENT_TYPE) {
            writeToFile(functionName, ...args);
        }
    }

    this.log = (...args) => {
        printToConsoleAndFile("log", ...args);
    }

    this.info = (...args) => {
        printToConsoleAndFile("info", ...args);
    }

    this.warn = (...args) => {
        printToConsoleAndFile("warn", ...args);
    }

    this.trace = (...args) => {
        printToConsoleAndFile("trace", ...args);
    }

    this.debug = (...args) => {
        printToConsoleAndFile("debug", ...args);
    }

    this.error = (...args) => {
        printToConsoleAndFile("error", ...args);
    }

    this.critical = (...args) => {
        printToConsoleAndFile("critical", ...args);
    }
}

const getLogger = (className, moduleName, criticalLogFile) => {
    return new Logger(className, moduleName, criticalLogFile);
}

module.exports = {
    getLogger
}
