exports.sendToTargetWindow = (target, command, data) => {
    target.webContents.send(command.toString(), data)
};


