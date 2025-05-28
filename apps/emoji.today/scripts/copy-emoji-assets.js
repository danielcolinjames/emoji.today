const fs = require("fs")
const path = require("path")

// Paths
const sourceDir = path.join(__dirname, "../../../packages/emoji-assets/images")
const targetDir = path.join(__dirname, "../public/emoji-assets")

// Remove existing symlink or directory
if (fs.existsSync(targetDir)) {
  const stats = fs.lstatSync(targetDir)
  if (stats.isSymbolicLink()) {
    fs.unlinkSync(targetDir)
    console.log("Removed existing symlink")
  } else if (stats.isDirectory()) {
    fs.rmSync(targetDir, { recursive: true, force: true })
    console.log("Removed existing directory")
  }
}

// Copy the directory
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory()

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true })
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      )
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

console.log("Copying emoji assets...")
copyRecursiveSync(sourceDir, targetDir)
console.log("Emoji assets copied successfully!")
