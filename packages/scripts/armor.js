const asarmor = require('asarmor');
const { join } = require("path");

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`Applying armor ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch();
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};