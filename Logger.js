function Logger(className, moduleName, criticalLogFile) {
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

    const getPreamble = (functionName) => {
        const type = functionName.toUpperCase();
        const timestamp = Date.now().toString();
        const preamble = `${type}${getPaddingForArg(type, 9)}${timestamp} ${normalizeArg(className)} ${normalizeArg(moduleName)}`;
        return preamble;
    }

    const executeFunctionFromConsole = (functionName, ...args) => {
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "string") {
                args[i] = args[i].replaceAll("\n", "\n\t");
            }
        }

        console[functionName](getPreamble(functionName), ...args);
    }

    this.log = (...args) => {
        executeFunctionFromConsole("log", ...args);
    }

    this.info = (...args) => {
        executeFunctionFromConsole("info", ...args);
    }

    this.warn = (...args) => {
        executeFunctionFromConsole("warn", ...args);
    }

    this.trace = (...args) => {
        executeFunctionFromConsole("trace", ...args);
    }

    this.debug = (...args) => {
        executeFunctionFromConsole("debug", ...args);
    }

    this.error = (...args) => {
        executeFunctionFromConsole("error", ...args);
    }

    this.critical = (...args) => {
        const callback = args.pop();
        if (typeof criticalLogFile === "undefined") {
            return callback(Error("criticalLogFile argument is missing"));
        }

        const fs = require("fs");
        const path = require("path");
        let stringToBeWritten = getPreamble("critical");
        for (let i = 0; i < args.length; i++) {
            stringToBeWritten += args[i]
        }

        stringToBeWritten += require("os").EOL;

        fs.access(criticalLogFile, err => {
            if (err) {
                fs.access(path.dirname(criticalLogFile), err => {
                    if (err) {
                        fs.mkdir(path.dirname(criticalLogFile), {recursive: true}, err => {
                            if (err) {
                                return callback(err);
                            }

                            fs.writeFile(criticalLogFile, stringToBeWritten, callback);
                        })

                        return;
                    }

                    fs.writeFile(criticalLogFile, stringToBeWritten, callback);
                });

                return;
            }

            fs.appendFile(criticalLogFile, stringToBeWritten, callback);
        })
    }
}

const getLogger = (className, moduleName, criticalLogFile) => {
    return new Logger(className, moduleName, criticalLogFile);
}

module.exports = {
    getLogger
}
