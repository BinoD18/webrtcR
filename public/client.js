// public/client.js
const socket = io('/');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

function start() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localVideo.srcObject = stream;
            localStream = stream;
            callButton.disabled = false;
        })
        .catch(error => console.error('Error accessing media devices.', error));
}

function call() {
    peerConnection = new RTCPeerConnection(servers);
    peerConnection.onicecandidate = handleICECandidateEvent;
    peerConnection.ontrack = handleTrackEvent;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            socket.emit('offer', {
                sdp: peerConnection.localDescription,
                target: roomId
            });
        });
    callButton.disabled = true;
    hangupButton.disabled = false;
}

function handleICECandidateEvent(event) {
    if (event.candidate) {
        socket.emit('ice-candidate', {
            target: roomId,
            candidate: event.candidate
        });
    }
}

function handleTrackEvent(event) {
    remoteVideo.srcObject = event.streams[0];
}

socket.on('user-connected', () => {
    console.log('User connected');
});

socket.on('user-disconnected', () => {
    console.log('User disconnected');
    hangup();
});

socket.on('offer', async (offer) => {
    if (!peerConnection) {
        call();
    }
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer.sdp));
    const answer = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(answer);
    socket.emit('answer', {
        sdp: peerConnection.localDescription,
        target: roomId
    });
});

socket.on('answer', (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer.sdp));
});

socket.on('ice-candidate', (candidate) => {
    const iceCandidate = new RTCIceCandidate(candidate.candidate);
    peerConnection.addIceCandidate(iceCandidate);
});

function hangup() {
    peerConnection.close();
    peerConnection = null;
    callButton.disabled = false;
    hangupButton.disabled = true;
}
