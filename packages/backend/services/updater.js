const { autoUpdater } = require("electron-updater");

exports.initializeUpdater = (config, window) => {
    process.env.GH_TOKEN = config.token;
    autoUpdater.setFeedURL(config);
    autoUpdater.autoDownload = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on("error", async error => {
        console.log(error.message);
    });
        
    autoUpdater.on("checking-for-update", async info => {
        console.log(info);
    });
         
    autoUpdater.on("update-available", async info => {
        console.log(info);
        await autoUpdater.downloadUpdate();
    });
        
    autoUpdater.on("update-not-available", async info => {
        console.log(info);
    });
        
    autoUpdater.on("download-progress", async progressInfo => {
        console.log(progressInfo);
    });
        
    autoUpdater.on("update-downloaded", async info => {
        console.log(info);
        autoUpdater.quitAndInstall(false, true);
    });
};