const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../database/disabledFolders.json');

function getDisabledFolders() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ folders: [] }, null, 2));
  return JSON.parse(fs.readFileSync(file)).folders;
}
function setDisabledFolders(folders) {
  fs.writeFileSync(file, JSON.stringify({ folders }, null, 2));
}
function addDisabledFolder(folder) {
  const folders = getDisabledFolders();
  if (!folders.includes(folder)) {
    folders.push(folder);
    setDisabledFolders(folders);
  }
}
function removeDisabledFolder(folder) {
  const folders = getDisabledFolders().filter(f => f !== folder);
  setDisabledFolders(folders);
}
function isFolderDisabled(folder) {
  return getDisabledFolders().includes(folder);
}

module.exports = { getDisabledFolders, addDisabledFolder, removeDisabledFolder, isFolderDisabled };
