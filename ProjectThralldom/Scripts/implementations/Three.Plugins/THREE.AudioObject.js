/**
 * Many thanks to AlteredQualia for the AudioObject and cwilso for the MonkeyPath, I've edited a couple things to ease integration with Thralldom. 
 * Example: http://alteredqualia.com/three/examples/webgl_city.html 
 * Source: http://alteredqualia.com/three/examples/js/AudioObject.js
 * MonkeyPatch: https://github.com/cwilso/webkitAudioContext-MonkeyPatch
 *
 * ******************************

//})();

/* THREE.AudioObject BELOW */

/*
 *
 * @author alteredq / http://alteredqualia.com/
 * 
 *
 * AudioObject
 *
 *	- 3d spatialized sound with Doppler-shift effect
 *
 *	- uses Audio API (currently supported in WebKit-based browsers)
 *		https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html
 *
 *	- based on Doppler effect demo from Chromium
 * 		http://chromium.googlecode.com/svn/trunk/samples/audio/doppler.html
 *
 * - parameters
 *
 *		- listener
 *			dopplerFactor	// A constant used to determine the amount of pitch shift to use when rendering a doppler effect.
 *			speedOfSound	// The speed of sound used for calculating doppler shift. The default value is 343.3 meters / second.
 *
 *		- panner
 *			refDistance		// A reference distance for reducing volume as source move further from the listener.
 *			maxDistance		// The maximum distance between source and listener, after which the volume will not be reduced any further.
 *			rolloffFactor	// Describes how quickly the volume is reduced as source moves away from listener.
 * 			coneInnerAngle	// An angle inside of which there will be no volume reduction.
 *			coneOuterAngle 	// An angle outside of which the volume will be reduced to a constant value of coneOuterGain.
 *			coneOuterGain	// Amount of volume reduction outside of the coneOuterAngle.
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext || function DummyAudioContext() {
    this.decodeAudioData = function () { return "Web Audio is not supported" };
    this.isDummy = true;
};


THREE.AudioObject = function (context, buffer, volume, loop, isDirectional) {

    THREE.Object3D.call(this);

    playbackRate = 1;
    if (volume === undefined) volume = 1;
    if (loop === undefined) loop = true;

    this.context = context;

    this.directionalSource = !!isDirectional;

    this.listener = this.context.listener;
    this.panner = this.context.createPanner();
    this.source = this.context.createBufferSource();
    this.source.buffer = buffer;

    this.masterGainNode = this.context.createGain();
    this.dryGainNode = this.context.createGain();

    // Setup initial gains

    this.masterGainNode.gain.value = volume;
    // Magicness
    this.dryGainNode.gain.value = 30.0;

    // Connect dry mix

    this.source.connect(this.panner);
    this.panner.connect(this.dryGainNode);
    this.dryGainNode.connect(this.masterGainNode);

    // Connect master gain

    this.masterGainNode.connect(this.context.destination);

    // Set source parameters and load sound

    this.source.playbackRate.value = playbackRate;
    this.source.loop = loop;

    // private properties

    var soundPosition = new THREE.Vector3(),
	cameraPosition = new THREE.Vector3();

    var _this = this;

    // API

    this.setVolume = function (volume) {

        this.masterGainNode.gain.value = volume;

    };

    // Some tweaks (commented out velocities and quaternions) in the methods below as it was using a deprecated version of three.js
    this.update = function (camera) {

        soundPosition.setFromMatrixPosition(this.matrixWorld);
        cameraPosition.setFromMatrixPosition(camera.matrixWorld);

        this.listener.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        this.panner.setPosition(soundPosition.x, soundPosition.y, soundPosition.z);
    };

    // THRALLDOM: Add a flag to check when the sound has finished
    var hasFinished = false;

    this.play = function () {

        // Black magic going down here
        this.listener.dopplerFactor = 1;


        this.source.start();

        if (!this.source.loop) {
            setTimeout(function () { 
                hasFinished = true
            }, this.source.buffer.duration * 1000);
        }
    };

    this.stop = function () {
        this.source.stop();
        hasFinished = true;
    }

    this.hasFinished = function () {
        return hasFinished;
    }
};

THREE.AudioObject.prototype = new THREE.Object3D();
THREE.AudioObject.prototype.constructor = THREE.AudioObject;

THREE.AudioObject.prototype.type = null;
