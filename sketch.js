// MQTT details
let broker = { hostname: 'public.cloud.shiftr.io', port: 443 };
let creds = { clientID: 'p5FrogWebClient', userName: 'public', password: 'public' };
let topic = 'wavy-tubular';
let client;

// p5 assets & UI elements
let bubbleGif;
let isBubbling = false;
let bubbleTimer = 0;
let msgInput;
let sendBtn;
let inputLabel;

function preload() {
    // Create the image hidden by default via inline CSS style
    bubbleGif = createImg('assets/bubbles.gif', 'Bubbles Animation');
    bubbleGif.style('display', 'none'); 
}

function setup() {
    let canvas = createCanvas(400, 100);
    canvas.parent('main');

    // Label for optional message
    inputLabel = createP('Add an optional message (max 30 characters):');
    inputLabel.parent('main');
    inputLabel.style('color', '#ffffff');
    inputLabel.style('margin', '10px 0 5px 0');
    inputLabel.style('font-size', '14px');

    // Create input box with 32-character limit
    msgInput = createInput('');
    msgInput.attribute('placeholder', 'Type message here...');
    msgInput.attribute('maxlength', '30'); // Enforces 30 char max in HTML
    msgInput.parent('main');
    msgInput.style('display', 'block');
    msgInput.style('padding', '8px');
    msgInput.style('width', '300px');
    msgInput.style('margin-bottom', '10px');

    // Create trigger button
    sendBtn = createButton('Blow Bubbles! 🫧');
    sendBtn.parent('main');
    sendBtn.style('display', 'block');
    sendBtn.style('padding', '10px 20px');
    sendBtn.style('background-color', '#4CAF50');
    sendBtn.style('color', 'white');
    sendBtn.style('border', 'none');
    sendBtn.style('border-radius', '5px');
    sendBtn.style('cursor', 'pointer');
    sendBtn.mousePressed(sendBubbleTrigger);

    // Attach GIF to main container and ensure it is hidden on startup
    bubbleGif.parent('main');
    bubbleGif.hide();
    bubbleGif.style('margin-top', '15px');
    bubbleGif.style('width', '300px');

    // Initialize MQTT
    client = new Paho.MQTT.Client(broker.hostname, Number(broker.port), creds.clientID);
    
    client.onConnectionLost = (response) => {
        let statusDiv = select('#status');
        if (statusDiv) statusDiv.html('Connection lost: ' + response.errorMessage);
    };

    client.connect({
        useSSL: true,
        userName: creds.userName,
        password: creds.password,
        onSuccess: () => {
            let statusDiv = select('#status');
            if (statusDiv) statusDiv.html('Connected to Shiftr.io!');
        },
        onFailure: (err) => {
            let statusDiv = select('#status');
            if (statusDiv) statusDiv.html('Connection failed: ' + err.errorMessage);
        }
    });
}

function draw() {
    background(30);

    if (isBubbling) {
        fill(76, 175, 80);
        textAlign(CENTER, CENTER);
        textSize(18);
        text("Blowing Bubbles! 🫧", width / 2, height / 2);

        // Hide GIF and reset page state after 8 seconds (8000 ms)
        if (millis() - bubbleTimer > 8000) {
            isBubbling = false;
            bubbleGif.hide();
            msgInput.value(''); // Reset input text field
        }
    } else {
        fill(150);
        textAlign(CENTER, CENTER);
        textSize(16);
        text("Ready. Click button to trigger!", width / 2, height / 2);
    }
}

async function sendBubbleTrigger() {
    if (!client || !client.isConnected()) {
        alert('MQTT is not connected yet!');
        return;
    }

    // 1. Get raw text typed by user
    let userText = msgInput.value().trim();
    if (userText.length > 30) userText = userText.substring(0, 30);

    // 2. Fetch location string (e.g. "NYC, US")
    let locStr = await getLocationString();
    if (locStr.length > 30) locStr = locStr.substring(0, 30);

    // 4. Format: "trigger: User Message | Location"
    let payload = "trigger";
    if (userText.length > 0 || locStr.length > 0) {
        payload += `: ${userText}|${locStr}`;
    }
    
    // 5. Send MQTT message
    let msg = new Paho.MQTT.Message(payload);
    msg.destinationName = topic;
    client.send(msg);

    // 6. Start visual GIF timer
    isBubbling = true;
    bubbleGif.attribute('src', 'assets/bubbles.gif?t=' + millis());
    bubbleGif.show();
    bubbleTimer = millis();
}

async function getLocationString() {
    // Attempt 1: ipapi.co
    try {
        let res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            let data = await res.json();
            let city = data.city || '';
            let region = (data.region_code && data.region_code.length <= 3) ? data.region_code : (data.country_code || '');
            if (city && region) return `${city}, ${region}`;
            if (city) return city;
        }
    } catch (e) {
        console.warn('ipapi.co failed, trying ip-api.com fallback...', e);
    }

    // Attempt 2: ip-api.com fallback
    try {
        let res = await fetch('https://ip-api.com/json/');
        if (res.ok) {
            let data = await res.json();
            let city = data.city || '';
            let region = data.region || data.countryCode || '';
            if (city && region) return `${city}, ${region}`;
            if (city) return city;
        }
    } catch (e) {
        console.warn('Fallback location lookup failed:', e);
    }

    return '';
}
