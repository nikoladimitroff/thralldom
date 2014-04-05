/**
 * Many thanks to AlteredQualia for the AudioObject and cwilso for the MonkeyPath, I've edited a couple things to ease integration with Thralldom. 
 * Example: http://alteredqualia.com/three/examples/webgl_city.html 
 * Source: http://alteredqualia.com/three/examples/js/AudioObject.js
 * MonkeyPatch: https://github.com/cwilso/webkitAudioContext-MonkeyPatch
 *
 * ******************************

 /* MONKEYPATCH BELOW */


/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/* 

This monkeypatch library is intended to be included in projects that use 
webkitAudioContext (instead of AudioContext), and that may use the now-
deprecated bits of the Web Audio API (e.g. using BufferSourceNode.noteOn()
instead of BufferSourceNode.start().

This library should be harmless to include if the browser does not have
the unprefixed "AudioContext" implemented.  If unprefixed AudioContext is
supported, but the deprecated method names are already implemented, this
library will have created a few shim functions on create* methods, but 
will not damage or override anything else.

Ideally, the use of this library will go to zero - it is only intended as
a way to quickly get script written to the old Web Audio methods to work
in browsers that only support the new, approved methods.

The patches this library handles:

AudioBufferSourceNode.noteOn() is aliased to start()
AudioBufferSourceNode.noteGrainOn() is aliased to start()
AudioBufferSourceNode.noteOff() is aliased to stop()
AudioContext.createGainNode() is aliased to createGain()
AudioContext.createDelayNode() is aliased to createDelay()
AudioContext.createJavaScriptNode() is aliased to createScriptProcessor()
OscillatorNode.noteOn() is aliased to start()
OscillatorNode.noteOff() is aliased to stop()
AudioParam.setTargetValueAtTime() is aliased to setTargetAtTime()
OscillatorNode's old enum values are aliased to the Web IDL enum values.
BiquadFilterNode's old enum values are aliased to the Web IDL enum values.
PannerNode's old enum values are aliased to the Web IDL enum values.
AudioContext.createWaveTable() is aliased to createPeriodicWave().
OscillatorNode.setWaveTable() is aliased to setPeriodicWave().

*/
(function (global, exports, perf) {
    'use strict';

    function fixSetTarget(param) {
        if (!param)	// if NYI, just return
            return;
        if (!param.setTargetValueAtTime)
            param.setTargetValueAtTime = param.setTargetAtTime; 
    }

    if (window.hasOwnProperty('AudioContext') && !window.hasOwnProperty('webkitAudioContext')) {
        window.webkitAudioContext = AudioContext;

        AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
        AudioContext.prototype.createGain = function() { 
            var node = this.internal_createGain();
            fixSetTarget(node.gain);
            return node;
        };

        AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
        AudioContext.prototype.createDelay = function() { 
            var node = this.internal_createDelay();
            fixSetTarget(node.delayTime);
            return node;
        };

        AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
        AudioContext.prototype.createBufferSource = function() { 
            var node = this.internal_createBufferSource();
            if (!node.noteOn)
                node.noteOn = node.start; 
            if (!node.noteOnGrain)
                node.noteOnGrain = node.start;
            if (!node.noteOff)
                node.noteOff = node.stop;
            fixSetTarget(node.playbackRate);
            return node;
        };

        AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
        AudioContext.prototype.createDynamicsCompressor = function() { 
            var node = this.internal_createDynamicsCompressor();
            fixSetTarget(node.threshold);
            fixSetTarget(node.knee);
            fixSetTarget(node.ratio);
            fixSetTarget(node.reduction);
            fixSetTarget(node.attack);
            fixSetTarget(node.release);
            return node;
        };

        AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
        AudioContext.prototype.createBiquadFilter = function() { 
            var node = this.internal_createBiquadFilter();
            fixSetTarget(node.frequency);
            fixSetTarget(node.detune);
            fixSetTarget(node.Q);
            fixSetTarget(node.gain);
            var enumValues = ['LOWPASS', 'HIGHPASS', 'BANDPASS', 'LOWSHELF', 'HIGHSHELF', 'PEAKING', 'NOTCH', 'ALLPASS'];
            node.prototype = node.__proto__.prototype;
            for (var i = 0; i < enumValues.length; ++i) {
                var enumValue = enumValues[i];
                var newEnumValue = enumValue.toLowerCase();
                if (!node.prototype.hasOwnProperty(enumValue)) {
                    node.prototype[enumValue] = newEnumValue;
                }
            }
            return node;
        };

        if (AudioContext.prototype.hasOwnProperty( 'createOscillator' )) {
            AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
            AudioContext.prototype.createOscillator = function() { 
                var node = this.internal_createOscillator();
                if (!node.noteOn)
                    node.noteOn = node.start; 
                if (!node.noteOff)
                    node.noteOff = node.stop;
                fixSetTarget(node.frequency);
                fixSetTarget(node.detune);
                var enumValues = ['SINE', 'SQUARE', 'SAWTOOTH', 'TRIANGLE', 'CUSTOM'];
                node.prototype = node.__proto__.prototype;
                for (var i = 0; i < enumValues.length; ++i) {
                    var enumValue = enumValues[i];
                    var newEnumValue = enumValue.toLowerCase();
                    if (!node.prototype.hasOwnProperty(enumValue)) {
                        node.prototype[enumValue] = newEnumValue;
                    }
                }
                if (!node.prototype.hasOwnProperty('setWaveTable')) {
                    node.prototype.setWaveTable = node.prototype.setPeriodicTable;
                }
                return node;
            };
        }

        AudioContext.prototype.internal_createPanner = AudioContext.prototype.createPanner;
        AudioContext.prototype.createPanner = function() {
            var node = this.internal_createPanner();
            var enumValues = {
                'EQUALPOWER': 'equalpower',
                'HRTF': 'HRTF',
                'LINEAR_DISTANCE': 'linear',
                'INVERSE_DISTANCE': 'inverse',
                'EXPONENTIAL_DISTANCE': 'exponential',
            };
            node.prototype = node.constructor.prototype;
            for (var enumValue in enumValues) {
                var newEnumValue = enumValues[enumValue];
                if (!node.prototype.hasOwnProperty(enumValue)) {
                    node.prototype[enumValue] = newEnumValue;
                }
            }
            return node;
        };

        if (!AudioContext.prototype.hasOwnProperty('createGainNode'))
            AudioContext.prototype.createGainNode = AudioContext.prototype.createGain;
        if (!AudioContext.prototype.hasOwnProperty('createDelayNode'))
            AudioContext.prototype.createDelayNode = AudioContext.prototype.createDelay;
        if (!AudioContext.prototype.hasOwnProperty('createJavaScriptNode'))
            AudioContext.prototype.createJavaScriptNode = AudioContext.prototype.createScriptProcessor;
        if (!AudioContext.prototype.hasOwnProperty('createWaveTable'))
            AudioContext.prototype.createWaveTable = AudioContext.prototype.createPeriodicWave;
    }
}(window));

window.AudioContext = window.AudioContext || window.webkitAudioContext || function DummyAudioContext() {
    this.decodeAudioData = function () { return "Web Audio is not supported" };
    this.isDummy = true;
};

// Thralldom Test
//(function () {
//    "use strict";

//    if (window.AudioContext) {
//        return;
//    }

//    window.AudioContext = window.AudioContext || window.webkitAudioContext;

//    function updatePrototype(type, prototypeMappings) {
//        for (var i in prototypeMappings) {
//            var mapping = prototypeMappings[i];
//            type.prototype[mapping[0]] = type.prototype[mapping[0]] || type.prototype[mapping[1]];
//        }

//    }

//    var contextMappings = [
//        ["createGain", "createGainNode"],
//        ["createDelay", "createDelayNode"],
//        ["createScriptProcessor", "createJavaScriptNode"],
//        ["createPeriodicWave", "createWaveTable"]
//    ]

//    window.AudioPannerNode = window.AudioPannerNode || window.webkitAudioPannerNode;
    
//    var bufferSourceMappings = [
//        ["start", "noteOn"],
//        ["start", "noteGrainOn"],
//        ["noteOff", "stop"],
//    ]

//    var oscillatorMappings = [
//        ["start", "noteOn"],
//        ["stop", "noteOff"],
//        ["setPeriodicWave", "setWaveTable"]
//    ]
    

//    AudioParam.setTargetValueAtTime() is aliased to setTargetAtTime()
//    OscillatorNode's old enum values are aliased to the Web IDL enum values.
//    BiquadFilterNode's old enum values are aliased to the Web IDL enum values.
//    PannerNode's old enum values are aliased to the Web IDL enum values.




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

THREE.AudioObject = function (context, buffer, volume, loop, isDirectional) {

    THREE.Object3D.call(this);

    playbackRate = 1;
    if (volume === undefined) volume = 1;
    if (loop === undefined) loop = true;

    this.context = context;

    this.directionalSource = isDirectional;

    this.listener = this.context.listener;
    this.panner = this.context.createPanner();
    this.source = this.context.createBufferSource();
    this.source.buffer = buffer;

    this.masterGainNode = this.context.createGainNode();
    this.dryGainNode = this.context.createGainNode();

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
	cameraPosition = new THREE.Vector3(),
	oldSoundPosition = new THREE.Vector3(),
	oldCameraPosition = new THREE.Vector3(),

	soundDelta = new THREE.Vector3(),
	cameraDelta = new THREE.Vector3(),

	soundFront = new THREE.Vector3(),
	cameraFront = new THREE.Vector3(),
	soundUp = new THREE.Vector3(),
	cameraUp = new THREE.Vector3();

    var _this = this;

    // API

    this.setVolume = function (volume) {

        this.masterGainNode.gain.value = volume;

    };

    // Some tweaks (commented out velocities and quaternions) in the methods below as it was using a deprecated version of three.js
    this.update = function (camera) {

        oldSoundPosition.copy(soundPosition);
        oldCameraPosition.copy(cameraPosition);

        soundPosition.setFromMatrixPosition(this.matrixWorld);
        cameraPosition.setFromMatrixPosition(camera.matrixWorld);

        soundDelta.subVectors(soundPosition, oldSoundPosition);
        cameraDelta.subVectors(cameraPosition, oldCameraPosition);

        cameraUp.copy(camera.up);

        cameraFront.set(0, 0, -1);
        cameraFront.transformDirection(camera.matrixWorld);
        cameraFront.normalize();

        this.listener.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        //this.listener.setVelocity(cameraDelta.x, cameraDelta.y, cameraDelta.z);
        //this.listener.setOrientation(cameraFront.x, cameraFront.y, cameraFront.z, cameraUp.x, cameraUp.y, cameraUp.z);

        this.panner.setPosition(soundPosition.x, soundPosition.y, soundPosition.z);
        //this.panner.setVelocity(soundDelta.x, soundDelta.y, soundDelta.z);

        if (this.directionalSource) {

            soundFront.set(0, 0, -1);
            soundFront.transformDirection(this.matrixWorld);
            soundFront.normalize();

            soundUp.copy(this.up);
            //this.panner.setOrientation(soundFront.x, soundFront.y, soundFront.z, soundUp.x, soundUp.y, soundUp.z);

        }


    };

    // THRALLDOM: Add a flag to check when the sound has finished
    var hasFinished = false;

    this.play = function () {

        // Black magic going down here
        this.listener.dopplerFactor = 1;
        //this.panner.refDistance = 5000;
        //this.panner.maxDistance = 50000;
        //this.panner.rolloffFactor = 5;


        this.source.noteOn(0);

        if (!this.source.loop) {
            setTimeout(function () { 
                hasFinished = true
            }, this.source.buffer.duration * 1000);
        }
    };

    this.stop = function () {
        this.source.noteOff(0);
        hasFinished = true;
    }

    this.hasFinished = function () {
        return hasFinished;
    }
};

THREE.AudioObject.prototype = new THREE.Object3D();
THREE.AudioObject.prototype.constructor = THREE.AudioObject;

THREE.AudioObject.prototype.type = null;
