function Logger(className, moduleName, criticalLogFile) {
    if (typeof className === "undefined" || typeof moduleName === "undefined") {
        throw Error(`Arguments className and moduleName are mandatory.`);
    }

    const getPaddingForArg = (arg) => {
        let noSpaces = Math.abs(9 - arg.length);
        let spaces = String(" ").repeat(noSpaces);
        return spaces;
    };

    const getPreamble = (functionName) => {
        const type = functionName.toUpperCase();
        const timestamp = Date.now().toString();
        const preamble = `${type}${getPaddingForArg(timestamp)}${timestamp}${getPaddingForArg(className)}${className}${getPaddingForArg(moduleName)}${moduleName}${getPaddingForArg(moduleName)}`;
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
