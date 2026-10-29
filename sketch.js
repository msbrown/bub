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

function preload() {
    // Load local GIF asset
    bubbleGif = createImg('assets/bubbles.gif', 'Bubbles Animation');
    bubbleGif.hide();
}

function setup() {
    let canvas = createCanvas(400, 300);
    canvas.parent('main');

    // Create input box using p5 DOM
    msgInput = createInput('');
    msgInput.attribute('placeholder', 'Optional message for LCD...');
    msgInput.parent('main');
    msgInput.style('display', 'block');
    msgInput.style('margin', '10px auto');
    msgInput.style('padding', '8px');
    msgInput.style('width', '280px');

    // Create button using p5 DOM
    sendBtn = createButton('Blow Bubbles! 🫧');
    sendBtn.parent('main');
    sendBtn.style('display', 'block');
    sendBtn.style('margin', '0 auto 15px auto');
    sendBtn.style('padding', '10px 20px');
    sendBtn.style('background-color', '#4CAF50');
    sendBtn.style('color', 'white');
    sendBtn.style('border', 'none');
    sendBtn.style('border-radius', '5px');
    sendBtn.style('cursor', 'pointer');
    sendBtn.mousePressed(sendBubbleTrigger);

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
        // Display GIF centered on canvas
        image(bubbleGif, 50, 20, 300, 220);
        
        fill(76, 175, 80);
        textAlign(CENTER);
        textSize(18);
        text("Blowing Bubbles! 🫧", width / 2, 270);

        // Hide GIF after 7 seconds
        if (millis() - bubbleTimer > 7000) {
            isBubbling = false;
            bubbleGif.hide();
        }
    } else {
        fill(150);
        textAlign(CENTER);
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
    let payload = extraText.length > 0 ? `trigger: ${extraText}` : 'trigger';

    let msg = new Paho.MQTT.Message(payload);
    msg.destinationName = topic;
    client.send(msg);

    // Trigger visual GIF animation in p5
    isBubbling = true;
    bubbleGif.show();
    bubbleGif.position(canvas.offsetLeft + 50, canvas.offsetTop + 20);
    bubbleTimer = millis();
}
