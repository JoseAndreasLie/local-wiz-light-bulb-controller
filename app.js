// Wiz Light Bulb Control Server
// Install dependencies: npm install express dgram

const express = require("express");
const dgram = require("dgram");
const app = express();
const PORT = 3000;

// Replace with your Wiz bulb's IP address
const WIZ_BULB_IP = "192.168.0.100";
const WIZ_PORT = 38899;

app.use(express.json());
app.use(express.static("public")); // Serve HTML/CSS/JS files

// Function to send UDP command to Wiz bulb
function sendWizCommand(command) {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket("udp4");
    const message = Buffer.from(JSON.stringify(command));
    let isResolved = false;

    const cleanup = () => {
      if (!isResolved) {
        isResolved = true;
        try {
          client.close();
        } catch (e) {
          // Socket already closed
        }
      }
    };

    client.send(message, 0, message.length, WIZ_PORT, WIZ_BULB_IP, (err) => {
      if (err) {
        cleanup();
        reject(err);
      }
    });

    // Listen for response
    client.on("message", (msg) => {
      try {
        const response = JSON.parse(msg.toString());
        cleanup();
        resolve(response);
      } catch (e) {
        cleanup();
        reject(e);
      }
    });

    // Timeout after 3 seconds
    setTimeout(() => {
      if (!isResolved) {
        cleanup();
        reject(new Error("Timeout - could not reach bulb. Check IP address."));
      }
    }, 3000);
  });
}

// API Endpoints

// Turn on/off
app.post("/api/power", async (req, res) => {
  try {
    const { state } = req.body; // true for on, false for off
    const command = {
      method: "setPilot",
      params: { state },
    };
    const response = await sendWizCommand(command);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set brightness (10-100)
app.post("/api/brightness", async (req, res) => {
  try {
    const { brightness } = req.body;
    const command = {
      method: "setPilot",
      params: { state: true, dimming: brightness },
    };
    const response = await sendWizCommand(command);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set RGB color
app.post("/api/color", async (req, res) => {
  try {
    const { r, g, b } = req.body;
    const command = {
      method: "setPilot",
      params: { state: true, r, g, b },
    };
    const response = await sendWizCommand(command);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set color temperature (2200-6500K)
app.post("/api/temperature", async (req, res) => {
  try {
    const { temp } = req.body;
    const command = {
      method: "setPilot",
      params: { state: true, temp },
    };
    const response = await sendWizCommand(command);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current state
app.get("/api/state", async (req, res) => {
  try {
    const command = {
      method: "getPilot",
      params: {},
    };
    const response = await sendWizCommand(command);
    res.json({ success: true, state: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set scene (1-32)
app.post("/api/scene", async (req, res) => {
  try {
    const { sceneId } = req.body;
    const command = {
      method: "setPilot",
      params: { state: true, sceneId },
    };
    const response = await sendWizCommand(command);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Wiz Light Control Server running on http://localhost:${PORT}`);
  console.log(`Controlling bulb at: ${WIZ_BULB_IP}`);
});
