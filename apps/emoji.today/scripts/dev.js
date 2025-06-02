import localtunnel from "localtunnel"
import { spawn } from "child_process"
import { createServer } from "net"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// Load environment variables
dotenv.config({ path: ".env.local" })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(path.normalize(path.join(__dirname, "..")))

let tunnel
let nextDev
let isCleaningUp = false

const EMOJI_LOGO_1 = `
                                                                                                    
                                       +@@@@@@@@@@@@@@@@@@@@+                                       
                                 =@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=                                 
                             *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*                             
                          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                          
                       =@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+                       
                     =@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-                     
                   -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-                   
                  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                  
                @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                
               @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@               
             +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+             
            *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*            
           *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#           
          *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*          
          @@@@@@@@@@@@@@@@@@@@@@@@@%+==*%@@@@@@@@@@@@@@@@@@%*==+%@@@@@@@@@@@@@@@@@@@@@@@@@.         
         @@@@@@@@@@@@@@@@@@@@@@@@@        @@@@@@@@@@@@@@@@        @@@@@@@@@@@@@@@@@@@@@@@@@         
        %@@@@@@@@@@@@@@@@@@@@@@@@          @@@@@@@@@@@@@@          @@@@@@@@@@@@@@@@@@@@@@@@%        
        @@@@@@@@@@@@@@@@@@@@@@@@@          @@@@@@@@@@@@@@          @@@@@@@@@@@@@@@@@@@@@@@@@        
       %@@@@@@@@@@@@@@@@@@@@@@@@@+        %@@@@@@@@@@@@@@%        +@@@@@@@@@@@@@@@@@@@@@@@@@%       
       @@@@@@@@@@@@@@@@@@@@@@@@@@@@     :@@@@@@@@@@@@@@@@@@:     @@@@@@@@@@@@@@@@@@@@@@@@@@@@       
       @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@       
      .@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.      
      #@@@@@@@@@@@@@@@@@@@@@@@@@@-     #@@@@@@@@@@@@@@@@@@@@#     -@@@@@@@@@@@@@@@@@@@@@@@@@@#      
      @@@@@@@@@@@@@@@@@@@@@@@@@@@       @@@@@@@@@@@@@@@@@@@@       @@@@@@@@@@@@@@@@@@@@@@@@@@@      
      #@@@@@@@@@@@@@@@@@@@@@@@@@@       @@@@@@@@@@@@@@@@@@@@       @@@@@@@@@@@@@@@@@@@@@@@@@@#      
      :@@@@@@@@@@@@@@@@@@@@@@@@@@       +@@@@@@@@@@@@@@@@@@+       @@@@@@@@@@@@@@@@@@@@@@@@@@:      
       @@@@@@@@@@@@@@@@@@@@@@@@@@@       #@@@@@@@@@@@@@@@@*       @@@@@@@@@@@@@@@@@@@@@@@@@@@       
       @@@@@@@@@@@@@@@@@@@@@@@@@@@*        @@@@@@@@@@@@@@        *@@@@@@@@@@@@@@@@@@@@@@@@@@@       
       %@@@@@@@@@@@@@@@@@@@@@@@@@@@-          %@@@@@@%          =@@@@@@@@@@@@@@@@@@@@@@@@@@@%       
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@%                          %@@@@@@@@@@@@@@@@@@@@@@@@@@@@        
        %@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+                      +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%        
         @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@         
         .@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#-          -#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.         
          *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*          
           #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#           
            #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*            
             *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*             
              .@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.              
                @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                
                  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                  
                   -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-                   
                     +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+                     
                       #@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#                       
                          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                          
                             *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*                             
                                 +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+                                 
                                      :+@@@@@@@@@@@@@@@@@@@@+:                                      
                                                :--:                                                

`

// ASCII art for emoji.today logo
const EMOJI_LOGO = `
                                            :@@@@@@@@@@-                                            
                                    %@@@@@@@@@@@@@@@@@@@@@@@@@@%                                    
                                @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                
                             @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.                            
                          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                          
                        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                        
                      @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                      
                    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                    
                   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                   
                  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                  
                 @@@@@@@@@@@@@@@@@@@@       @@@@@@@@@@@@       @@@@@@@@@@@@@@@@@@@@                 
                 @@@@@@@@@@@@@@@@@@@         @@@@@@@@@@         @@@@@@@@@@@@@@@@@@@                 
                @@@@@@@@@@@@@@@@@@@@@       @@@@@@@@@@@@       @@@@@@@@@@@@@@@@@@@@@                
                @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                
               @@@@@@@@@@@@@@@@@@@@@@:   @@@@@@@@@@@@@@@@@@   -@@@@@@@@@@@@@@@@@@@@@@               
               @@@@@@@@@@@@@@@@@@@@@      @@@@@@@@@@@@@@@@      @@@@@@@@@@@@@@@@@@@@@               
               @@@@@@@@@@@@@@@@@@@@@      @@@@@@@@@@@@@@@@      @@@@@@@@@@@@@@@@@@@@@               
                @@@@@@@@@@@@@@@@@@@@@      @@@@@@@@@@@@@@      @@@@@@@@@@@@@@@@@@@@@                
                @@@@@@@@@@@@@@@@@@@@@@       @@@@@@@@@@       @@@@@@@@@@@@@@@@@@@@@@                
                :@@@@@@@@@@@@@@@@@@@@@@@                    @@@@@@@@@@@@@@@@@@@@@@@:                
                 @@@@@@@@@@@@@@@@@@@@@@@@@%              *@@@@@@@@@@@@@@@@@@@@@@@@@                 
                  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+  +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                  
                   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                   
                    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                    
                      @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                      
                        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                        
                          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                          
                            =@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=                            
                                @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                
                                    %@@@@@@@@@@@@@@@@@@@@@@@@@@%                                    
                                            @@@@@@@@@@@@
`

const EMOJI_LOGO_2 = `
                                           &&&&&&&&&&&&&&&&&&&&&&&&                                           
                                     &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                                     
                                 &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                                 
                              &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                              
                            &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                            
                          &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                          
                        &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                        
                      &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                      
                     &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                     
                    &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                    
                   &&&&&&&&&&&&&&&&&&&&&&&&   &&&&&&&&&&&&&&&&&&:  &&&&&&&&&&&&&&&&&&&&&&&&&                  
                  &&&&&&&&&&&&&&&&&&&&&&        &&&&&&&&&&&&&&        &&&&&&&&&&&&&&&&&&&&&&                  
                 &&&&&&&&&&&&&&&&&&&&&&          &&&&&&&&&&&&          &&&&&&&&&&&&&&&&&&&&&&                 
                 &&&&&&&&&&&&&&&&&&&&&&&        &&&&&&&&&&&&&&        &&&&&&&&&&&&&&&&&&&&&&&                 
                 &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                
                &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                
                &&&&&&&&&&&&&&&&&&&&&&&x      &&&&&&&&&&&&&&&&&&       &&&&&&&&&&&&&&&&&&&&&&&                
                &&&&&&&&&&&&&&&&&&&&&&&       &&&&&&&&&&&&&&&&&&       &&&&&&&&&&&&&&&&&&&&&&&                
                &&&&&&&&&&&&&&&&&&&&&&&&      &&&&&&&&&&&&&&&&&&      &&&&&&&&&&&&&&&&&&&&&&&&                
                 &&&&&&&&&&&&&&&&&&&&&&&        &&&&&&&&&&&&&&        &&&&&&&&&&&&&&&&&&&&&&&&                
                 &&&&&&&&&&&&&&&&&&&&&&&&&        :&&&&&&&&:        &&&&&&&&&&&&&&&&&&&&&&&&&                 
                 &&&&&&&&&&&&&&&&&&&&&&&&&&                        &&&&&&&&&&&&&&&&&&&&&&&&&&                 
                  &&&&&&&&&&&&&&&&&&&&&&&&&&&&                  &&&&&&&&&&&&&&&&&&&&&&&&&&&&                  
                   &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&          &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                  
                    &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                    
                     &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                     
                      &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                      
                        &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                        
                          &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                          
                            &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                            
                              &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                              
                                 &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                                 
                                     &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                                     
                                           &&&&&&&&&&&&&&&&&&&&&&&&
`

async function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer()

    server.once("error", () => {
      resolve(true) // Port is in use
    })

    server.once("listening", () => {
      server.close()
      resolve(false) // Port is free
    })

    server.listen(port)
  })
}

async function killProcessOnPort(port) {
  try {
    if (process.platform === "win32") {
      // Windows: Use netstat to find the process
      const netstat = spawn("netstat", ["-ano", "|", "findstr", `:${port}`])
      netstat.stdout.on("data", (data) => {
        const match = data.toString().match(/\s+(\d+)$/)
        if (match) {
          const pid = match[1]
          spawn("taskkill", ["/F", "/PID", pid])
        }
      })
      await new Promise((resolve) => netstat.on("close", resolve))
    } else {
      // Unix-like systems: Use lsof
      const lsof = spawn("lsof", ["-ti", `:${port}`])
      lsof.stdout.on("data", (data) => {
        data
          .toString()
          .split("\n")
          .forEach((pid) => {
            if (pid) {
              try {
                process.kill(parseInt(pid), "SIGKILL")
              } catch (e) {
                if (e.code !== "ESRCH") throw e
              }
            }
          })
      })
      await new Promise((resolve) => lsof.on("close", resolve))
    }
  } catch (e) {
    // Ignore errors if no process found
  }
}

async function startDev() {
  // Show the logo first
  console.log(EMOJI_LOGO_2)

  // Check if port 3000 is already in use
  const isPortInUse = await checkPort(3000)
  if (isPortInUse) {
    console.error(
      "Port 3000 is already in use. To find and kill the process using this port:\n\n" +
        (process.platform === "win32"
          ? "1. Run: netstat -ano | findstr :3000\n" +
            "2. Note the PID (Process ID) from the output\n" +
            "3. Run: taskkill /PID <PID> /F\n"
          : `On macOS/Linux, run:\nnpm run cleanup\n`) +
        "\nThen try running this command again."
    )
    process.exit(1)
  }

  const useTunnel = process.env.USE_TUNNEL === "true"
  let frameUrl
  let ip = null

  if (useTunnel) {
    console.log("🔗 Tunneling enabled (USE_TUNNEL=true)")
    // Start localtunnel and get URL
    tunnel = await localtunnel({ port: 3000 })

    try {
      ip = await fetch("https://ipv4.icanhazip.com")
        .then((res) => res.text())
        .then((ip) => ip.trim())
    } catch (error) {
      console.error("Error getting IP address:", error)
    }

    frameUrl = tunnel.url
    console.log(`
🚀 Starting emoji.today in development mode...

📱 Quick start instructions:
   1. Copy your IP address (below)
   2. Open the tunnel URL
   3. Paste your IP in the password field
   4. Click "Click to Submit"

💻 To test in Farcaster Dev Tools:
   Go to: https://farcaster.xyz/~/developers
   Enter: ${tunnel.url}

📱 To test in Warpcast mobile:
   Settings > Developer > Mini Apps
   Enter: ${tunnel.url}
`)
  } else {
    console.log("🔗 Tunneling disabled (USE_TUNNEL is not 'true')")
    console.log(
      "💡 To enable tunneling for Farcaster testing, add USE_TUNNEL=true to your .env.local"
    )
    frameUrl = "http://localhost:3000"
    console.log(`
🚀 Starting emoji.today in development mode...

💻 To test your mini app:
   1. Open: https://farcaster.xyz/~/developers
   2. Scroll to "Preview Mini App"
   3. Enter: ${frameUrl}
   4. Click "Preview"
`)
  }

  // Start next dev with appropriate configuration
  const nextBin = path.normalize(
    path.join(projectRoot, "node_modules", ".bin", "next")
  )

  nextDev = spawn(nextBin, ["dev"], {
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_URL: frameUrl, NEXTAUTH_URL: frameUrl },
    cwd: projectRoot,
    shell: process.platform === "win32", // Add shell option for Windows
  })

  // Show the important info at the end with visual padding
  if (useTunnel && ip) {
    // Wait a bit for Next.js to start up
    setTimeout(() => {
      console.log(`

════════════════════════════════════════════════════════════════════════

        ${ip}    //    ${tunnel.url}

════════════════════════════════════════════════════════════════════════
`)
    }, 2000)
  }

  // Handle cleanup
  const cleanup = async () => {
    if (isCleaningUp) return
    isCleaningUp = true

    console.log("\n\nShutting down...")

    try {
      if (nextDev) {
        try {
          // Kill the main process first
          nextDev.kill("SIGKILL")
          // Then kill any remaining child processes in the group
          if (nextDev?.pid) {
            try {
              process.kill(-nextDev.pid)
            } catch (e) {
              // Ignore ESRCH errors when killing process group
              if (e.code !== "ESRCH") throw e
            }
          }
          console.log("🛑 Next.js dev server stopped")
        } catch (e) {
          // Ignore errors when killing nextDev
          console.log("Note: Next.js process already terminated")
        }
      }

      if (tunnel) {
        try {
          await tunnel.close()
          console.log("🌐 Tunnel closed")
        } catch (e) {
          console.log("Note: Tunnel already closed")
        }
      }

      // Force kill any remaining processes on port 3000
      await killProcessOnPort(3000)
    } catch (error) {
      console.error("Error during cleanup:", error)
    } finally {
      process.exit(0)
    }
  }

  // Handle process termination
  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
  process.on("exit", cleanup)
  if (tunnel) {
    tunnel.on("close", cleanup)
  }
}

startDev().catch(console.error)
