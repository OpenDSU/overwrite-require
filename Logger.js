function Logger(className, moduleName, logFile) {
    if (typeof className === "undefined" || typeof moduleName === "undefined") {
        throw Error(`Arguments className and moduleName are mandatory.`);
    }

    const MAX_STRING_LENGTH = 11;
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

    const getPreamble = (functionName, code = 0) => {
        const type = functionName.toUpperCase();
        const timestamp = Date.now().toString();
        const preamble = `${type}${getPaddingForArg(type, 9)}${convertIntToHexString(code)} ${timestamp} ${normalizeArg(className)} ${normalizeArg(moduleName)}`;
        return preamble;
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
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "string") {
                args[i] = args[i].replaceAll("\n", "\n\t");
            }
        }

        const res = stripCodeFromArgs(...args);
        const preamble = getPreamble(functionName, res.code);
        if (functionName === "critical") {
            functionName = "error";
        }
        console[functionName](preamble, ...res.args);
    }

    const writeToFile = (functionName, ...args) => {
        const fs = require("fs");
        const path = require("path");
        if (typeof logFile === "undefined") {
            return;
        }
        const res = stripCodeFromArgs(...args);
        let stringToBeWritten = getPreamble(functionName, res.code);
        for (let i = 0; i < res.args.length; i++) {
            stringToBeWritten += res.args[i]
        }

        stringToBeWritten += require("os").EOL;

        try {
            fs.accessSync(path.dirname(logFile));
        } catch (e) {
            fs.mkdirSync(path.dirname(logFile), {recursive: true});
        }

        fs.appendFileSync(logFile, stringToBeWritten);
    }

    const printToConsoleAndFile = (functionName, ...args) => {
        executeFunctionFromConsole(functionName, ...args);
        const envTypes = require("./moduleConstants");
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
