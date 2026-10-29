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
    inputLabel = createP('Add an optional message (max 32 characters):');
    inputLabel.parent('main');
    inputLabel.style('color', '#ffffff');
    inputLabel.style('margin', '10px 0 5px 0');
    inputLabel.style('font-size', '14px');

    // Create input box with 32-character limit
    msgInput = createInput('');
    msgInput.attribute('placeholder', 'Type message here...');
    msgInput.attribute('maxlength', '32'); // Enforces 32 char max in HTML
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

function sendBubbleTrigger() {
    if (!client || !client.isConnected()) {
        alert('MQTT is not connected yet!');
        return;
    }

    let extraText = msgInput.value().trim();
    // Ensure payload does not exceed 32 extra chars
    if (extraText.length > 32) {
        extraText = extraText.substring(0, 32);
    }

    let payload = extraText.length > 0 ? `trigger: ${extraText}` : 'trigger';

    let msg = new Paho.MQTT.Message(payload);
    msg.destinationName = topic;
    client.send(msg);

    // Play GIF and start 8-second timer
    isBubbling = true;
    bubbleGif.attribute('src', 'assets/bubbles.gif?t=' + millis()); // Force GIF restart from frame 0
    bubbleGif.show();
    bubbleTimer = millis();
}
