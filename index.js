const request = require('request');

var Service;
var Characteristic;

module.exports = homebridge => {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory(
		"homebridge-http-window-covering",
		"HttpWindowCovering",
		HttpWindowCovering);
};

class HttpWindowCovering {
	constructor(log, config) {
		this.service = new Service.WindowCovering(this.name);
		this.log = log;
		this.name = config.name || "Window Covering";
		this.outputValueMultiplier = config.outputValueMultiplier || 1;
		this.urlSetTargetPosition = config.urlSetTargetPosition;

		this.currentPosition = 100;
		this.targetPosition = 100;

		this.positionState = Characteristic.PositionState.STOPPED;
		this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
	}
	identify(callback) {
		this.log("Identify requested!");
		callback(null);
	}
	getCurrentPosition(callback) {
		this.log("getCurrentPosition:", this.currentPosition);
		callback(null, this.currentPosition);
	}
	getName(callback) {
		this.log("getName :", this.name);
		callback(null, this.name);
	}
	getTargetPosition(callback) {
		this.log("getTargetPosition :", this.targetPosition);
		callback(null, this.targetPosition);
	}
	setTargetPosition(value, callback) {
		this.log("setTargetPosition from %s to %s", this.targetPosition, value);
		this.targetPosition = value;

		if (this.targetPosition > this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.INCREASING);
		} else if (this.targetPosition < this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.DECREASING);
		} else if (this.targetPosition = this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
		}

		request((this.urlSetTargetPosition.replace('%VALUE%', Math.round (value * this.outputValueMultiplier))), (error, response, body) => {
			this.currentPosition = this.targetPosition;
			this.service.setCharacteristic(Characteristic.CurrentPosition, this.currentPosition);
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
			this.log("currentPosition is now %s", this.currentPosition);
			callback(null);
		});
	}
	getPositionState(callback) {
		this.log("getPositionState :", this.positionState);
		callback(null, this.positionState);
	}
	getServices() {
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "Jeffrey Lanters")
			.setCharacteristic(Characteristic.Model, "HTTP Window Covering")
			.setCharacteristic(Characteristic.SerialNumber, "HWC01");

		this.service
			.getCharacteristic(Characteristic.Name)
			.on('get', this.getName.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentPosition)
			.on('get', this.getCurrentPosition.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetPosition)
			.on('get', this.getTargetPosition.bind(this))
			.on('set', this.setTargetPosition.bind(this));

		this.service
			.getCharacteristic(Characteristic.PositionState)
			.on('get', this.getPositionState.bind(this));

		return [informationService, this.service];
	}
}