const envTypes = require("./moduleConstants");
const originalConsole = Object.assign({}, console);
const IS_DEV_MODE = process.env.DEV === "true" || typeof process.env.DEV === "undefined";
if (typeof process.env.OPENDSU_ENABLE_DEBUG === "undefined" ) {
    process.env.OPENDSU_ENABLE_DEBUG = IS_DEV_MODE.toString();
}
const DEBUG_LOG_ENABLED = process.env.OPENDSU_ENABLE_DEBUG === "true";
if ($$.environmentType === envTypes.NODEJS_ENVIRONMENT_TYPE) {
    const logger = new Logger("Logger", "overwrite-require");
    if (DEBUG_LOG_ENABLED) {
        logger.log = logger.debug;
    } else {
        logger.log = () => {}
    }
    Object.assign(console, logger);
}

function Logger(className, moduleName, logFile) {
    const MAX_STRING_LENGTH = 11;
    const getPaddingForArg = (arg, maxLen = MAX_STRING_LENGTH) => {
        let noSpaces = Math.abs(maxLen - arg.length);
        let spaces = String(" ").repeat(noSpaces);
        return spaces;
    };

    const convertIntToHexString = (number) => {
        let hexString = number.toString("16");
        if (hexString.length === 1) {
            hexString = "0" + hexString;
        }
        return "0x" + hexString;
    }

    const normalizeArg = (arg) => {
        if (arg.length >= MAX_STRING_LENGTH) {
            return arg.substring(0, MAX_STRING_LENGTH);
        } else {
            return `${arg}${getPaddingForArg(arg)}`;
        }
    }

    const createLogObject = (functionName, code = 0, ...args) => {
        let message = "";
        for (let i = 0; i < args.length; i++) {
            message += args[i] + " ";
        }

        message = message.trimEnd();
        const logObject = {
            severity: functionName.toUpperCase(),
            timestamp: new Date().toISOString(),
            eventTypeId: convertIntToHexString(code),
            component: moduleName,
            className: className,
            message
        }
        return logObject;
    }

    const getLogStringFromObject = (logObject, appendEOL = false) => {
        let logString;
        if (IS_DEV_MODE) {
            logObject.message = logObject.message.replaceAll("\n", "\n\t");
            logString = `${logObject.severity}${getPaddingForArg(logObject.severity, 9)}${logObject.eventTypeId}${getPaddingForArg(logObject.eventTypeId, 3)} ${logObject.timestamp}`;

            if (typeof logObject.component !== "undefined") {
                logString = `${logString} ${normalizeArg(logObject.component)}`;
            }
            if (typeof logObject.className !== "undefined") {
                logString = `${logString} ${normalizeArg(logObject.className)}`;
            }

            logString = `${logString} ${logObject.message}`;

            if (appendEOL) {
                logString += require("os").EOL;
            }
        } else {
            logObject.message = logObject.message.replaceAll("\n", "\\n");
            logObject.message = logObject.message.replaceAll("\r", "\\r");
            logString = JSON.stringify(logObject);
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
        if (typeof code !== "number" || args.length === 1) {
            code = 0;
        } else {
            args.shift();
        }

        return {
            code,
            args
        }
    }

    const getConsoleFunction = (functionName) => {
        if (functionName === functions.CRITICAL) {
            functionName = functions.ERROR;
        }

        if (functionName === functions.AUDIT) {
            functionName = functions.LOG;
        }

        return functionName;
    }

    const executeFunctionFromConsole = (functionName, ...args) => {
        const log = getLogAsString(functionName, false, ...args);
        originalConsole[getConsoleFunction(functionName)](log);
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

    const functions = {
        LOG: "log",
        INFO: "info",
        WARN: "warn",
        TRACE: "trace",
        DEBUG: "debug",
        ERROR: "error",
        CRITICAL: "critical",
        AUDIT: "audit"
    }

    for (let fnName in functions) {
        this[functions[fnName]] = (...args) => {
            printToConsoleAndFile(functions[fnName], ...args);
        }
    }

    if (!DEBUG_LOG_ENABLED) {
        this[functions.TRACE] = this[functions.DEBUG] = () => {};
    }
}

const getLogger = (className, moduleName, criticalLogFile) => {
    return new Logger(className, moduleName, criticalLogFile);
}

module.exports = {
    getLogger
}
